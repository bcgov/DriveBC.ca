import io
import json
import logging
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
from apps.webcam.models import Webcam
from apps.consumer.models import ImageIndex
from apps.shared.status import get_recent_timestamps, calculate_camera_status
from botocore.config import Config

tf = TimezoneFinder()

APP_DIR = Path(__file__).resolve().parent
FONT = ImageFont.truetype(f'{APP_DIR}/static/BCSans.otf', size=14)
FONT_LARGE = ImageFont.truetype(f'{APP_DIR}/static/BCSans.otf', size=24)
# PVC path to original images for RIDE
PVC_ORIGINAL_PATH = os.getenv("PVC_ORIGINAL_PATH", "/app/images/webcams/originals")
# PVC path to watermarked images with timestamp for ReplayTheDay
PVC_WATERMARKED_PATH = os.getenv("PVC_WATERMARKED_PATH", "/app/images/webcams/processed")
# PVC path to watermarked images for current DriveBC without timestamp
DRIVCBC_PVC_WATERMARKED_PATH = os.getenv("DRIVCBC_PVC_WATERMARKED_PATH", "/app/images/webcams")
# Output directory for JSON files for ReplayTheDay and Timelapse
JSON_OUTPUT_DIR = os.getenv("JSON_OUTPUT_DIR", "/app/data")


os.makedirs(JSON_OUTPUT_DIR, exist_ok=True)

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
S3_REGION = os.getenv("S3_REGION", "us-east-1")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq/")
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL", "")
QUEUE_NAME = os.getenv("RABBITMQ_QUEUE_NAME", "drivebc-image-consumer")
QUEUE_MAX_BYTES = int(os.getenv("RABBITMQ_QUEUE_MAX_BYTES", "209715200"))  # default 200MB
EXCHANGE_NAME = os.getenv("RABBITMQ_EXCHANGE_NAME", "dev.exchange.fanout.drivebc.images")


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

async def run_consumer():
    """
    Long-running RabbitMQ consumer that processes image messages and watermarks them.
    Shuts down cleanly when stop_event is set.
    """
    rb_url = os.getenv("RABBITMQ_URL")
    if not rb_url:
        raise RuntimeError("RABBITMQ_URL environment variable is not set.")

    # Load DB camera metadata once at startup.
    rows = get_all_from_db()
    db_data = process_camera_rows(rows)
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
                        # # 658 is off
                        # # 219 MDT
                        # if camera_id != "343" and camera_id != "57" and camera_id != "658" and camera_id != "219" and camera_id != "36":
                        #     logger.info("Skipping processing for camera %s", camera_id)
                        #     continue
                        await handle_image_message(camera_id, db_data, message.body, timestamp_local, camera_status)
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
            'id': row.get('ID'),
            'cam_internet_name': row.get('Cam_InternetName', ''),
            'cam_internet_caption': row.get('Cam_InternetCaption', ''),
            'Cam_internet_comments': row.get('Cam_InternetComments', ''),
            'cam_locations_orientation': row.get('Cam_LocationsOrientation', ''),
            'cam_locations_geo_latitude': row.get('Cam_LocationsGeo_Latitude'),
            'cam_locations_geo_longitude': row.get('Cam_LocationsGeo_Longitude'),
            'cam_locations_segment': row.get('Cam_LocationsSegment', ''),
            'cam_locations_lrs_node': row.get('Cam_LocationsLRS_Node', ''),
            "cam_installation_date_approximate": row.get('Cam_InstallationDate_Approximate', '0'),
            "cam_installation_approx_install_cost": row.get('Cam_InstallationApprox_Install_Cost', '0'),
            "cam_installation_fed_funding": row.get('Cam_InstallationFed_Funding', '0'),
            "cam_locations_region": row.get('Cam_LocationsRegion', ''),
            "cam_locations_highway": row.get('Cam_LocationsHighway', ''),
            "cam_locations_highway_section": row.get('Cam_LocationsHighway_Section', ''),
            "cam_locations_elevation": row.get('Cam_LocationsElevation', ''),
            "cam_locations_weather_station": row.get('Cam_LocationsWeather_Station', ''),
            "cam_locations_forecast_id": row.get('Cam_LocationsForecast_ID', ''),
            "cam_maintenance_asset_No": row.get('Cam_MaintenanceAsset_No', ''),
            "last_update_modified": datetime.now(timezone.utc),
            "update_period_mean": 300,
            "update_period_stddev": 60,
            "dbc_mark": row.get('Cam_InternetDBC_Mark', 'DriveBC.ca'),
            "is_on": True if not row.get('Cam_ControlDisabled') else False,
            "message": {
                "long": row.get('Cam_MaintenanceMaint_Notes', 'This is a sample message for the webcam.')
            }
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
            return

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
        mark = webcam.get('dbc_mark', 'DriveBC.ca')
        pen.text((3,  height + 14), mark, fill="white", anchor='ls', font=FONT)

        # Return image as byte array
        buffer = io.BytesIO()
        stamped.save(buffer, format="JPEG")
        buffer.seek(0)
        return buffer.read()

    except Exception as e:
        logger.error(f"Error processing image from camer: {e}")

def save_original_image_to_pvc(camera_id: str, image_bytes: bytes):
    # Save original image to PVC, can be overwritten each time
    save_dir = os.path.join(PVC_ORIGINAL_PATH)
    os.makedirs(save_dir, exist_ok=True)
    filename = f"{camera_id}.jpg"

    filepath = os.path.join(save_dir, filename)
    # try:
    #     with open(filepath, "wb") as f:
    #         f.write(image_bytes)
    # except Exception as e:
    #     logger.error(f"Error saving original image to PVC {filepath}: {e}")

    original_pvc_path = filepath
    # logger.info(f"Original image saved to PVC at {filepath}")
    return original_pvc_path

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
    
    watermarked_pvc_path = filepath
    return watermarked_pvc_path

def save_watermarked_image_to_drivebc_pvc(camera_id: str, image_bytes: bytes):  
    os.makedirs(os.path.dirname(f'{DRIVCBC_PVC_WATERMARKED_PATH}'), exist_ok=True)

    save_dir = os.path.join(DRIVCBC_PVC_WATERMARKED_PATH)
    os.makedirs(save_dir, exist_ok=True)
    filename = f"{camera_id}.jpg"
    filepath = os.path.join(save_dir, filename)

    try:
        with open(filepath, "wb") as f:
            f.write(image_bytes)
        logger.info(f"Watermarked image saved to drivebc PVC at {filepath}")
    except Exception as e:
        logger.error(f"Error saving Watermarked image to drivebc PVC {filepath}: {e}")
    
    watermarked_pvc_path = filepath
    return watermarked_pvc_path

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
def insert_image_and_update_webcam(camera_id, original_pvc_path, watermarked_pvc_path,
                                   original_s3_path, watermarked_s3_path, timestamp):
    camera = Webcam.objects.get(id=camera_id)

    ImageIndex.objects.create(
        camera_id=camera_id,
        original_pvc_path=original_pvc_path,
        watermarked_pvc_path=watermarked_pvc_path,
        original_s3_path=original_s3_path,
        watermarked_s3_path=watermarked_s3_path,
        timestamp=timestamp,
    )

    camera.https_cam = True
    camera.last_update_modified = timestamp
    camera.last_update_attempt = timestamp
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
    return key

async def handle_image_message(camera_id: str, db_data: any, body: bytes, timestamp: str, camera_status: dict):
    # timestamp is in local time
    webcams = [cam for cam in db_data if cam['id'] == int(camera_id)]
    webcam = webcams[0] if webcams else None

    tz = get_timezone(webcam) if webcam else 'America/Vancouver'
    local_tz = pytz.timezone(tz)
    naive_dt = datetime.strptime(timestamp, "%Y%m%d%H%M%S%f")
    local_dt = local_tz.localize(naive_dt)
    utc_dt = local_dt.astimezone(pytz.utc)
    utc_timestamp_str = utc_dt.strftime("%Y%m%d%H%M%S")
    original_pvc_path = save_original_image_to_pvc(camera_id, body)
    original_s3_path = push_to_s3(body, camera_id, True, utc_timestamp_str)
    
    image_bytes = watermark(webcam, body, tz, timestamp)

    # Save watermarked images to PVC with timestamp
    watermarked_pvc_path = save_watermarked_image_to_pvc(camera_id, image_bytes, utc_timestamp_str)
    # Save watermarked images to drivebc PVC with camera_id
    watermarked_drivebc_pvc_path = save_watermarked_image_to_drivebc_pvc(camera_id, image_bytes)
    # Save watermarked images to S3 with timestamp
    watermarked_s3_path = push_to_s3(image_bytes, camera_id, False, utc_timestamp_str)

    # Insert record into DB
    await insert_image_and_update_webcam(
        camera_id,
        original_pvc_path,
        watermarked_pvc_path,
        original_s3_path,
        watermarked_s3_path,
        utc_dt
    )

async def update_webcams_json(db_data: list):
    output = []
    for cam in db_data:
        lat = cam.get("cam_locations_geo_latitude")
        lng = cam.get("cam_locations_geo_longitude")

        # Skip if latitude or longitude is missing or empty
        if not lat or not lng:
            logger.info(f"Skipping camera due to missing coordinates.")
            continue

        try:
            lat = float(lat)
            lng = float(lng)
        except ValueError:
            logger.error(f"Skipping camera due to invalid coordinates")
            continue

        output.append([
            cam["id"],
            cam.get("cam_internet_name", ""),
            cam.get("cam_internet_caption", ""),
            cam.get("cam_locations_orientation", ""),
            lat,
            lng,
            cam.get("cam_locations_segment", ""),
            cam.get("cam_locations_lrs_node", ""),
            "1" if cam.get("is_on") else "0",
            cam.get("cam_installation_date_approximate", "0"),
            cam.get("cam_installation_approx_install_cost", "0"),
            cam.get("cam_LocationsRegion", ""),
            cam.get("cam_locationsElevation", ""),
            cam.get("cam_locations_highway_section", ""),
            cam.get("cam_locations_weather_station", ""),
            cam.get("cam_locations_forecast_id", ""),
            cam.get("cam_maintenance_maint_notes", ""),
            cam.get("cam_maintenance_asset_no", ""),
        ])
    file_path = os.path.join(JSON_OUTPUT_DIR, "json", "images", "webcams.json")
    os.makedirs(os.path.join(JSON_OUTPUT_DIR, "json", "images"), exist_ok=True)

    async with aiofiles.open(file_path, "w", encoding="utf-8") as f_test:
        data_str = json.dumps(output, indent=4)
        await f_test.write(data_str)
    logger.info(f"JSON file for cameras saved at {file_path}")

    print(f"webcams.json generated with {len(output)} records.")

async def update_index_json(camera_id: str, tz: str):
    # By default, use the last 30 days of images for timelapse
    default_time_age = os.getenv("TIMELAPSE_HOURS", "720")
    results = await get_images_within(camera_id, hours=int(default_time_age))
    timestamps = []
    for item in results:
        timestamps.append(item.timestamp.strftime("%Y%m%d%H%M%S") + ".jpg")

    # Create the camera index JSON file
    file_path = os.path.join(JSON_OUTPUT_DIR, f"json/images/{camera_id}/index.json")
    os.makedirs(os.path.join(JSON_OUTPUT_DIR, f"json", f"images", camera_id), exist_ok=True)

    async with aiofiles.open(file_path, "w", encoding="utf-8") as f_test:
        data_str = json.dumps(timestamps, indent=4)
        await f_test.write(data_str)
    logger.info(f"JSON file for camera {camera_id} saved at {file_path}")

    return {
        "status": "success",
        "file_path": f"/data/json/images/{camera_id}/index.json"
    }