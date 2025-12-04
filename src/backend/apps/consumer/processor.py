import io
import json
import logging
import time
from math import floor
import os
from datetime import datetime, timedelta, timezone
import sys
from typing import Optional
from click import wrap_text
import logging
import pytz
import requests
import boto3
import aio_pika
import asyncio
import aiofiles
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from .db import get_all_from_db, load_index_from_db 
from timezonefinder import TimezoneFinder
from contextlib import asynccontextmanager
from aiormq.exceptions import ChannelInvalidStateError
from asgiref.sync import sync_to_async
from apps.webcam.models import Region, RegionHighway, Webcam
from apps.consumer.models import ImageIndex
from apps.shared.status import get_recent_timestamps, calculate_camera_status
from botocore.config import Config
from django.contrib.gis.geos import Point

tf = TimezoneFinder()

APP_DIR = Path(__file__).resolve().parent
FONT = ImageFont.truetype(f'{APP_DIR}/static/BCSans.otf', size=14)
FONT_LARGE = ImageFont.truetype(f'{APP_DIR}/static/BCSans.otf', size=24)
# PVC path to original images for RIDE
PVC_ORIGINAL_PATH = os.getenv("PVC_ORIGINAL_PATH", "")
# PVC path to watermarked images with timestamp for ReplayTheDay
PVC_WATERMARKED_PATH = os.getenv("PVC_WATERMARKED_PATH")
# PVC path to watermarked images for current DriveBC without timestamp
DRIVEBC_PVC_WATERMARKED_PATH = os.getenv("DRIVEBC_PVC_WATERMARKED_PATH")

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
logger.propagate = False


# Remove any default handlers
if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)

# Environment variables
S3_BUCKET = os.getenv("S3_BUCKET")
S3_REGION = os.getenv("S3_REGION")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
RABBITMQ_URL = os.getenv("RABBITMQ_URL")
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL")
QUEUE_NAME = os.getenv("RABBITMQ_QUEUE_NAME")
QUEUE_MAX_BYTES = int(os.getenv("RABBITMQ_QUEUE_MAX_BYTES"))
EXCHANGE_NAME = os.getenv("RABBITMQ_EXCHANGE_NAME")
CAMERA_CACHE_REFRESH_SECONDS = int(os.getenv("CAMERA_CACHE_REFRESH_SECONDS", "60"))


#boto3.set_stream_logger('botocore', logging.DEBUG)

# S3 client configuration
config = Config(
    signature_version='s3v4',
    retries={'max_attempts': 10},
    s3={
        'payload_signing_enabled': False,
        'checksum_validation': False,
        'enable_checksum': False,
        'addressing_style': 'path',
        'use_expect_continue': False
    }
)
# S3 client
s3_client = boto3.client(
    "s3",
    region_name=S3_REGION,
    aws_access_key_id=S3_ACCESS_KEY,
    aws_secret_access_key=S3_SECRET_KEY,
    endpoint_url=S3_ENDPOINT_URL,
    config=config
)

index_db = [] # image index loaded from DB
stop_event = asyncio.Event()

db_data = []  # cached camera metadata from SQL
last_camera_refresh = 0.0
image_invalid = False

async def run_consumer():
    """
    Long-running RabbitMQ consumer that processes image messages and watermarks them.
    Shuts down cleanly when stop_event is set.
    """
    rb_url = os.getenv("RABBITMQ_URL")
    if not rb_url:
        raise RuntimeError("RABBITMQ_URL environment variable is not set.")

    rows = await sync_to_async(get_all_from_db)()

    global db_data, last_camera_refresh
    db_data = process_camera_rows(rows)
    last_camera_refresh = time.time()
    if not db_data:
        logger.error("No camera data available for watermarking. Consumer exiting.")
        return

    logger.info("Starting RabbitMQ consumer.")

    connection: Optional[aio_pika.RobustConnection] = None
    channel: Optional[aio_pika.RobustChannel] = None
    queue = None

    try:
        connection = await aio_pika.connect_robust(rb_url)
        logger.info("Connected to RabbitMQ.")

        channel = await connection.channel()
        # Limit how many unacked messages take at once
        await channel.set_qos(prefetch_count=1)

        exchange = await channel.declare_exchange(
            name=EXCHANGE_NAME,
            type=aio_pika.ExchangeType.FANOUT,
            durable=True,
        )

        queue = await channel.declare_queue(
            QUEUE_NAME,
            durable=True,
            exclusive=False,
            auto_delete=False,
            arguments={"x-max-length-bytes": QUEUE_MAX_BYTES},
        )

        await queue.bind(exchange)
        logger.info("Queue bound to exchange; beginning consume loop.")

        # Consume loop
        async with queue.iterator() as queue_iter:
            async for message in queue_iter:
                if stop_event.is_set():
                    logger.info("Stop requested. Breaking consume loop.")
                    break

                async with message.process(ignore_processed=True):
                    filename = message.headers.get("filename", "unknown.jpg")
                    camera_id = filename.split("_")[0].split(".")[0]
                    timestamp_utc = message.headers.get("timestamp", "unknown")
                    camera_status = calculate_camera_status(timestamp_utc)

                    try:
                        timestamp_local = generate_local_timestamp(db_data, camera_id, timestamp_utc)
                        # # # For testing purposes, only allow camera with IDs below to be processed
                        # if camera_id != "57":
                        #     logger.info("Skipping processing for camera %s", camera_id)
                        #     continue
                        await handle_image_message(camera_id, message.body, timestamp_local, camera_status)
                        logger.info("Processed message for camera %s.", camera_id)
                    except Exception as e:
                        logger.exception("Failed processing message (camera %s): %s", camera_id, e)

        logger.info("Exited message iterator.")

    except asyncio.CancelledError:
        logger.info("Consumer cancelled; shutting down.")
        raise
    except ChannelInvalidStateError:
        logger.warning("AMQP channel closed unexpectedly during shutdown.")
    except Exception as e:
        logger.exception("Unhandled error in consumer: %s", e)
    finally:
        logger.info("Cleaning up RabbitMQ resources...")
        if channel:
            try:
                await channel.close()
            except Exception as e:
                logger.warning("Error closing channel: %s", e)
        if connection:
            try:
                await connection.close()
            except Exception as e:
                logger.warning("Error closing connection: %s", e)

        logger.info("Consumer stopped.")

def shutdown():
    """Signal handler to gracefully stop the consumer."""
    logger.info("Received shutdown signal.")
    stop_event.set()

def process_camera_rows(rows):
    if not rows:
        logger.error("No camera rows found in the database.")
        return []

    camera_list = []
    for row in rows:
        camera_obj = {
            'id': row.id if hasattr(row, 'id') else '',
            'cam_internet_name': row.cam_internetname if hasattr(row, 'cam_internetname') else '',
            'cam_internet_caption': row.cam_internetcaption if hasattr(row, 'cam_internetcaption') else '',
            'cam_internet_comments': row.cam_internetcomments if hasattr(row, 'cam_internetcomments') else '',
            'cam_locations_orientation': row.cam_locationsorientation if hasattr(row, 'cam_locationsorientation') else '',
            'cam_locations_geo_latitude': row.cam_locationsgeo_latitude if hasattr(row, 'cam_locationsgeo_latitude') else '',
            'cam_locations_geo_longitude': row.cam_locationsgeo_longitude if hasattr(row, 'cam_locationsgeo_longitude') else '',
            'cam_locations_segment': row.cam_locationssegment if hasattr(row, 'cam_locationssegment') else '',
            'cam_locations_lrs_node': row.cam_locationslrs_node if hasattr(row, 'cam_locationslrs_node') else '',
            'cam_locations_region': row.cam_locationsregion if hasattr(row, 'cam_locationsregion') else '',
            'cam_locations_highway': row.cam_locationshighway if hasattr(row, 'cam_locationshighway') else '',
            'cam_locations_highway_section': row.cam_locationshighway_section if hasattr(row, 'cam_locationshighway_section') else '',
            'cam_locations_elevation': row.cam_locationselevation if hasattr(row, 'cam_locationselevation') else '',
            'update_period_mean': 300,
            'update_period_stddev': 60,
            'dbc_mark': row.cam_internetdbc_mark if hasattr(row, 'cam_internetdbc_mark') else '',
            'is_on': not row.cam_controldisabled if hasattr(row, 'cam_controldisabled') else True,
            'cam_maintenanceis_on_demand': row.cam_maintenanceis_on_demand if hasattr(row, 'cam_maintenanceis_on_demand') else False,
            'is_new': row.isnew if hasattr(row, 'isnew') else False,
            'seq': row.seq if hasattr(row, 'seq') else 0,
            
        }
        camera_list.append(camera_obj)
    return camera_list


def get_timezone(webcam):
    lat = float(webcam.get('cam_locations_geo_latitude'))
    lon = float(webcam.get('cam_locations_geo_longitude'))

    tz_name = tf.timezone_at(lat=lat, lng=lon)
    return tz_name if tz_name else 'America/Vancouver'  # Fallback to PST if no timezone found

def watermark(webcam: any, image_data: bytes, tz: str, timestamp: str) -> bytes:
    try:
        if image_data is None:
            return None

        raw = Image.open(io.BytesIO(image_data))
        width, height = raw.size
        if width > 800:
            ratio = 800 / width
            width = 800
            height = floor(height * ratio)
            raw = raw.resize((width, height))

        stamped = Image.new('RGB', (width, height + 18))
        pen = ImageDraw.Draw(stamped)
        lastmod = webcam.get('last_update_modified')

        if webcam.get('is_on'):
            stamped.paste(raw)  # leaves 18 pixel black bar left at bottom
            dt = datetime.strptime(timestamp, "%Y%m%d%H%M%S%f")

            # Localize the naive datetime to the given timezone
            timezone = pytz.timezone(tz)
            dt_local = timezone.localize(dt)

            month = dt_local.strftime('%b')
            day = dt_local.strftime('%d')
            timestamp = f'{month} {day}, {dt_local.strftime("%Y %I:%M:%S %p %Z")}'
            pen.text((width - 3,  height + 14), timestamp, fill="white",
                     anchor='rs', font=FONT)

        else:  # camera is unavailable, replace image with message
            message = webcam.get('message', {}).get('long') or ""
            wrapped = wrap_text(
                text=message,
                width=min(width - 40, 500),
                initial_indent="",
                subsequent_indent="",
                preserve_paragraphs=False
            )
            bbox = pen.multiline_textbbox((0, 0), wrapped, font=FONT_LARGE)
            x = (width - bbox[2]) / 2
            pen.multiline_text((x, 20), wrapped, fill="white", align='center',
                               font=FONT_LARGE)
            pen.polygon(((0, height), (width, height),
                         (width, height + 18), (0, height + 18)),
                        fill="red")

        # add mark and timestamp to black bar
        mark = webcam.get('dbc_mark', '')
        pen.text((3,  height + 14), mark, fill="white", anchor='ls', font=FONT)

        # Return image as byte array
        buffer = io.BytesIO()
        stamped.save(buffer, format="JPEG")
        buffer.seek(0)
        return buffer.read()

    except Exception as e:
        logger.error(f"Error processing image from camera {webcam.get('id')}: {e}")
        return None

def save_original_image_to_pvc(camera_id: str, image_bytes: bytes):
    # Save original image to PVC, can be overwritten each time
    save_dir = os.path.join(PVC_ORIGINAL_PATH)
    os.makedirs(save_dir, exist_ok=True)
    filename = f"{camera_id}.jpg"

    filepath = os.path.join(save_dir, filename)
    try:
        with open(filepath, "wb") as f:
            f.write(image_bytes)
    except Exception as e:
        logger.error(f"Error saving original image to PVC {filepath}: {e}")
    logger.info(f"Original image saved to PVC at {filepath}")

def save_watermarked_image_to_pvc(camera_id: str, image_bytes: bytes, timestamp: str):  
    os.makedirs(os.path.dirname(f'{PVC_WATERMARKED_PATH}'), exist_ok=True)

    save_dir = os.path.join(PVC_WATERMARKED_PATH, camera_id)
    os.makedirs(save_dir, exist_ok=True)
    filename = f"{timestamp}.jpg"
    filepath = os.path.join(save_dir, filename)

    try:
        with open(filepath, "wb") as f:
            f.write(image_bytes)
        logger.info(f"Watermarked image saved to PVC at {filepath}")
    except Exception as e:
        logger.error(f"Error saving Watermarked image to PVC {filepath}: {e}")

def save_watermarked_image_to_drivebc_pvc(camera_id: str, image_bytes: bytes):  
    os.makedirs(os.path.dirname(f'{DRIVEBC_PVC_WATERMARKED_PATH}'), exist_ok=True)

    save_dir = os.path.join(DRIVEBC_PVC_WATERMARKED_PATH)
    os.makedirs(save_dir, exist_ok=True)
    filename = f"{camera_id}.jpg"
    filepath = os.path.join(save_dir, filename)

    try:
        with open(filepath, "wb") as f:
            f.write(image_bytes)
        logger.info(f"Watermarked image saved to drivebc PVC at {filepath}")
    except Exception as e:
        logger.error(f"Error saving Watermarked image to drivebc PVC {filepath}: {e}")

async def get_images_within(camera_id: str, hours: int = 720) -> list:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    index_db = await load_index_from_db()
    results = [
        ImageIndex(**entry) for entry in index_db
        if entry["camera_id"] == camera_id and entry["timestamp"] >= cutoff
    ]

    return results

def generate_local_timestamp(db_data: list, camera_id: str, timestamp: str):
    webcams = [cam for cam in db_data if cam['id'] == int(camera_id)]
    webcam = webcams[0] if webcams else None
    tz = get_timezone(webcam) if webcam else 'America/Vancouver'
    # Parse it as UTC datetime
    utc_dt = datetime.strptime(timestamp, "%Y%m%d%H%M%S%f")
    utc_dt = utc_dt.replace(tzinfo=pytz.utc)
    # Convert to local time
    local_tz = pytz.timezone(tz)
    local_dt = utc_dt.astimezone(local_tz)
    # Format back to string
    timestamp = local_dt.strftime("%Y%m%d%H%M%S%f")
    return timestamp

@sync_to_async
def insert_image_and_update_webcam(camera_id, timestamp, webcam):
    region = webcam.get('cam_locations_region', '')
    region_obj = Region.objects.using("mssql").filter(id=region).first()
    region_number = region_obj.seq if region_obj else None
    region_name = region_obj.name if region_obj else ''
    cam_locations_geo_latitude = webcam.get('cam_locations_geo_latitude', None)
    cam_locations_geo_longitude = webcam.get('cam_locations_geo_longitude', None)
     
    geometry = None
    if cam_locations_geo_latitude and cam_locations_geo_longitude:
        try:
            geometry = Point(float(cam_locations_geo_longitude), float(cam_locations_geo_latitude))
        except (ValueError, TypeError):
            geometry = None

    elevation = webcam.get('cam_locations_elevation', None)
    raw_hw = webcam.get("cam_locations_highway") or ""
    parts = raw_hw.split("_", 1)
    highway_number = parts[0]
    highway_description = parts[1] if len(parts) > 1 else ""
    highway_id = (
    f"{highway_number}_{highway_description}"
        if highway_description
        else highway_number
    )

    region_id = region_obj.id if region_obj else None
    highway_group = RegionHighway.objects.using("mssql").filter(
        highway_id=highway_id,
        region_id=region_id
    ).first().seq if region_id else None

    camera, created = Webcam.objects.get_or_create(
        id=camera_id,
        defaults={
            "name": f"{webcam.get('cam_internet_name', '')}",
            "caption": f"{webcam.get('cam_internet_caption', '')}",
            "region": region_number,
            "region_name": f"{region_name}",
            "highway": highway_number,
            "highway_description": highway_description,
            "highway_group": highway_group,
            "highway_cam_order": f"{webcam.get('seq', 0)}",
            "location": geometry,
            "orientation": webcam.get('cam_locations_orientation', ''),
            "elevation": elevation,
            "dbc_mark": webcam.get('dbc_mark', ''),
            "update_period_mean": webcam.get('update_period_mean', 300),
            "update_period_stddev": webcam.get('update_period_stddev', 60),
        }
    )

    ImageIndex.objects.create(
        camera_id=camera_id,
        timestamp=timestamp,
    )

    camera.https_cam = True
    camera.last_update_modified = timestamp
    camera.last_update_attempt = timestamp
    group_id = Webcam.objects.filter(location=camera.location).order_by('id').first().id
    camera.group_id = group_id
    camera.save()

def push_to_s3(image_bytes: bytes, camera_id: str, is_original: bool, timestamp: str):
    """
    Pushes the image bytes to S3 using a presigned URL.
    """
    if image_bytes is None:
        return
    key = f"webcams/originals/{camera_id}.jpg" if is_original else f"webcams/timelapse/{camera_id}/{timestamp}.jpg"   
    # Generate presigned PUT URL (signed for simple PUT)
    url = s3_client.generate_presigned_url(
        'put_object',
        Params={'Bucket': S3_BUCKET, 'Key': key, 'ContentType': 'image/jpeg'},
        ExpiresIn=300,
        HttpMethod='PUT'
    )

    # Upload with requests — a single PUT with Content-Length (no aws-chunked)
    if not is_original:
        resp = requests.put(
            url,
            data=image_bytes,
            headers={
                'Content-Type': 'image/jpeg',
                'Content-Length': str(len(image_bytes))
            },
            timeout=30
        )
        if resp.status_code not in (200, 201):
            raise RuntimeError(f's3 upload failed: {resp.status_code} {resp.text}')
        else:
            if not is_original:
                logger.info(f"Watermarked image saved to s3 at {key}")
            else:
                logger.info(f"Original image saved to s3 at {key}")

async def is_camera_pushed_too_soon(camera_id: str, timestamp: str):
    image = await sync_to_async(lambda: ImageIndex.objects.filter(camera_id=camera_id).order_by('-id').first())()
    if not image:
        return False
    last_modified = image.timestamp 
    dt_last_modified_str = last_modified.isoformat(sep=" ")
    dt_last_modified = datetime.fromisoformat(dt_last_modified_str)
    # convert to seconds
    millis_last_modified = int(dt_last_modified.timestamp())

    # parse pushed in timestamp
    dt_pushed_in = datetime.strptime(timestamp, "%Y%m%d%H%M%S%f")
    dt_pushed_in_utc = dt_pushed_in.astimezone(pytz.UTC)

    # convert to seconds
    millis_pushed_in = int(dt_pushed_in_utc.timestamp())
    diff = millis_pushed_in - millis_last_modified
    shred_interval = int(os.getenv("SECONDS_BETWEEN_IMAGE_UPLOADS"))
    if diff < shred_interval:
        return True
    return False

async def refresh_camera_cache():
    """
    Periodically refresh the cached camera metadata so status fields (e.g., is_on)
    stay in sync without restarting the consumer.
    """
    global db_data, last_camera_refresh
    now = time.time()
    if now - last_camera_refresh < CAMERA_CACHE_REFRESH_SECONDS:
        return

    try:
        rows = await sync_to_async(get_all_from_db)()
        refreshed = process_camera_rows(rows)
        if refreshed:
            db_data = refreshed
            last_camera_refresh = now
            logger.info("Refreshed camera metadata cache.")
    except Exception as e:
        logger.warning(f"Failed to refresh camera metadata cache: {e}")

async def handle_image_message(camera_id: str, body: bytes, timestamp: str, camera_status: dict):
    await refresh_camera_cache()
    # timestamp is in local time
    webcams = [cam for cam in db_data if cam['id'] == int(camera_id)]
    webcam = webcams[0] if webcams else None

    camera_pushed_too_soon = await is_camera_pushed_too_soon(camera_id, timestamp)
    if camera_pushed_too_soon:
        print(f"Camera {camera_id} pushed too soon, skipping.")
        return

    tz = get_timezone(webcam) if webcam else 'America/Vancouver'
    local_tz = pytz.timezone(tz)
    naive_dt = datetime.strptime(timestamp, "%Y%m%d%H%M%S%f")
    local_dt = local_tz.localize(naive_dt)
    utc_dt = local_dt.astimezone(pytz.utc)
    utc_timestamp_str = utc_dt.strftime("%Y%m%d%H%M%S")
    save_original_image_to_pvc(camera_id, body)
    push_to_s3(body, camera_id, True, utc_timestamp_str)

    image_invalid = not verify_image(body, camera_id)
    if image_invalid:
        logger.warning(f"Image from camera {camera_id} is invalid after watermarking. Skipping save and DB insert.") 
        return

    image_bytes = watermark(webcam, body, tz, timestamp)

    if image_bytes is None:
        logger.warning(f"Watermarking failed for camera {camera_id}. Skipping save and DB insert.")
        return

    # Save watermarked images to PVC with timestamp
    save_watermarked_image_to_pvc(camera_id, image_bytes, utc_timestamp_str)
    # Save watermarked images to drivebc PVC with camera_id
    save_watermarked_image_to_drivebc_pvc(camera_id, image_bytes)
    # Save watermarked images to S3 with timestamp
    push_to_s3(image_bytes, camera_id, False, utc_timestamp_str)

    # Insert record into DB
    await insert_image_and_update_webcam(
        camera_id,
        utc_dt,
        webcam
    )

def verify_image(image_data: bytes, camera_id: str) -> bool:
    # Validate image first
    try:
        with Image.open(io.BytesIO(image_data)) as img:
            img.verify()
        return True
    except Exception as e:
        logger.warning(f"Invalid image for camera {camera_id}: {e}")
        return False
