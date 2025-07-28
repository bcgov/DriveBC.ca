import io
import json
import logging
from math import floor
import os
from datetime import datetime, timedelta, timezone
import signal
import sys
from typing import Optional
from click import wrap_text
import logging
from pydantic import BaseModel
import pytz
import boto3
import aio_pika
import asyncio
import aiofiles
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


from .db import get_all_from_db
from timezonefinder import TimezoneFinder
from contextlib import asynccontextmanager
from aiormq.exceptions import ChannelInvalidStateError

# from collections import deque
# from asgiref.sync import sync_to_async
# from statistics import mean, stdev
# from apps.consumer.models import ImageIndex

from apps.shared.status import get_recent_timestamps, calculate_camera_status




tf = TimezoneFinder()


APP_DIR = Path(__file__).resolve().parent
FONT = ImageFont.truetype(f'{APP_DIR}/static/BCSans.otf', size=14)
FONT_LARGE = ImageFont.truetype(f'{APP_DIR}/static/BCSans.otf', size=24)
PVC_ORIGINAL_PATH = f'{APP_DIR}/images/webcams/originals'
PVC_WATERMARKED_PATH =f'{APP_DIR}/images/webcams/watermarked'
DRIVCBC_PVC_WATERMARKED_PATH =f'/app/images/webcams'

# Save files under "json" folder
OUTPUT_DIR = "/app/ReplayTheDay/json"
os.makedirs(OUTPUT_DIR, exist_ok=True)


logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

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

# S3 client
s3_client = None
s3_client = boto3.client(
    "s3",
    region_name=S3_REGION,
    aws_access_key_id=S3_ACCESS_KEY,
    aws_secret_access_key=S3_SECRET_KEY,
    endpoint_url=S3_ENDPOINT_URL
)

index_db = [] # image index loaded from DB
ready_event = asyncio.Event()
stop_event = asyncio.Event()

async def run_consumer(db_pool: any):
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

                    await get_recent_timestamps()
                    camera_status = calculate_camera_status(timestamp_utc)

                    try:
                        timestamp_local = generate_local_timestamp(db_data, camera_id, timestamp_utc)
                        # # For testing purposes, only allow camera with ID "343" to be processed
                        # if camera_id != "343" and camera_id != "57":
                        #     logger.info("Skipping processing for camera %s", camera_id)
                        #     continue
                        await handle_image_message(camera_id, db_data, message.body, timestamp_local, db_pool, camera_status)
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

class ImageMeta(BaseModel):
    camera_id: str
    original_pvc_path: str
    watermarked_pvc_path: str
    original_s3_path: str
    watermarked_s3_path: str
    timestamp: datetime

async def load_index_from_db(db_pool: any):
    async with db_pool.acquire() as conn:
        records = await conn.fetch("""
            SELECT camera_id, original_pvc_path, watermarked_pvc_path, original_s3_path, watermarked_s3_path, timestamp
            FROM image_index
            ORDER BY timestamp
        """)
        
        # Build the index list from DB rows
        index_db = [
            {
                "camera_id": record["camera_id"],
                "original_pvc_path": record["original_pvc_path"],
                "watermarked_pvc_path": record["watermarked_pvc_path"],
                "original_s3_path": record["original_s3_path"],
                "watermarked_s3_path": record["watermarked_s3_path"],
                "timestamp": record["timestamp"],
            }
            for record in records
        ]
        return index_db

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
            'cam_locationsGeo_latitude': row.get('Cam_LocationsGeo_Latitude'),
            'cam_locationsGeo_longitude': row.get('Cam_LocationsGeo_Longitude'),
            "last_update_modified": datetime.now(timezone.utc),
            "update_period_mean": 300,
            "update_period_stddev": 60,
            "dbc_mark": "DriveBC",
            "is_on": True if not row.get('Cam_ControlDisabled') else False,
            "message": {
                "long": "This is a sample message for the webcam."
            }
        }
        camera_list.append(camera_obj)
    return camera_list

def get_timezone(webcam):
    lat = float(webcam.get('cam_locationsGeo_latitude'))
    lon = float(webcam.get('cam_locationsGeo_longitude'))

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
            dt = datetime.strptime(timestamp, "%Y%m%d%H%M")

            # Localize the naive datetime to the given timezone
            timezone = pytz.timezone(tz)
            dt_local = timezone.localize(dt)
            
            month = dt_local.strftime('%b')
            day = dt_local.strftime('%d')
            timestamp = f'{month} {day}, {dt_local.strftime("%Y %H:%M:%S %p %Z")}'
            pen.text((width - 3,  height + 14), timestamp, fill="white",
                     anchor='rs', font=FONT)

        else:  # camera is unavailable, replace image with message
            message = webcam.get('message', {}).get('long')
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
        return buffer.getvalue()

    except Exception as e:
        logger.error(f"Error processing image from camer: {e}")

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

    original_pvc_path = filepath
    logger.info(f"Original image saved to PVC at {filepath}")
    return original_pvc_path

def save_original_image_to_s3(camera_id: str, image_bytes: bytes):
    # Save original image to s3
    ext = "jpg"
    key = f"originals/{camera_id}.{ext}"
    
    try:
        s3_client.put_object(Bucket=S3_BUCKET, Key=key, Body=image_bytes)
    except Exception as e:
        logger.error(f"Error saving original image to S3 bucket {S3_BUCKET}: {e}")

    original_s3_path = key
    logger.info(f"Origianal image saved to S3 at {key}")
    return original_s3_path

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

def save_watermarked_image_to_drivebc_pvc(camera_id: str, image_bytes: bytes, timestamp: str):  
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


def save_watermarked_image_to_s3(camera_id: str, image_bytes: bytes, timestamp: str):
    ext = "jpg"
    key = f"watermarked/{camera_id}/{timestamp}.{ext}"
    
    try:
        s3_client.put_object(Bucket=S3_BUCKET, Key=key, Body=image_bytes)
    except Exception as e:
        logger.error(f"Error saving watermarked image to S3 bucket {S3_BUCKET}: {e}")
    
    watermarked_s3_path = key
    logger.info(f"Wartermarked image saved to S3 at {key}")
    return watermarked_s3_path

# Mount the folder so it’s accessible at /json
async def get_images_within(camera_id: str, db_pool: any, hours: int = 24) -> list:
    # await ready_event.wait()
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    index_db = await load_index_from_db(db_pool)

    results = [
        ImageMeta(**entry) for entry in index_db
        if entry["camera_id"] == camera_id and entry["timestamp"] >= cutoff
    ]

    return results

def generate_local_timestamp(db_data: list, camera_id: str, timestamp: str):
    webcams = [cam for cam in db_data if cam['id'] == int(camera_id)]
    webcam = webcams[0] if webcams else None
    tz = get_timezone(webcam) if webcam else 'America/Vancouver'
    # Parse it as UTC datetime
    timestamp = timestamp[:-5]

    utc_dt = datetime.strptime(timestamp, "%Y%m%d%H%M")
    utc_dt = utc_dt.replace(tzinfo=pytz.utc)

    # Convert to PDT (America/Los_Angeles)
    local_tz = pytz.timezone(tz)
    local_dt = utc_dt.astimezone(local_tz)
    # Format back to string
    timestamp = local_dt.strftime("%Y%m%d%H%M")
    return timestamp


async def handle_image_message(camera_id: str, db_data: any, body: bytes, timestamp: str, db_pool: any, camera_status: dict):
    dt = datetime.strptime(timestamp, "%Y%m%d%H%M")

    original_pvc_path = save_original_image_to_pvc(camera_id, body)
    original_s3_path = save_original_image_to_s3(camera_id, body)

    webcams = [cam for cam in db_data if cam['id'] == int(camera_id)]
    webcam = webcams[0] if webcams else None
    tz = get_timezone(webcam) if webcam else 'America/Vancouver'

    image_bytes = watermark(webcam, body, tz, timestamp)

    # watermarked_pvc_path = save_watermarked_image_to_pvc(camera_id, image_bytes, timestamp)
    # watermarked_drivebc_pvc_path = save_watermarked_image_to_drivebc_pvc(camera_id, image_bytes, timestamp)

    watermarked_pvc_path = save_watermarked_image_to_drivebc_pvc(camera_id, image_bytes, timestamp)
    watermarked_s3_path = save_watermarked_image_to_s3(camera_id, image_bytes, timestamp)

    # update json file for replay the day
    await update_replay_json(camera_id, db_pool)

    # Insert record into DB
    async with db_pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO image_index (camera_id, original_pvc_path, watermarked_pvc_path, original_s3_path, watermarked_s3_path, timestamp)
            VALUES ($1, $2, $3, $4, $5, $6)
        """, camera_id, original_pvc_path, watermarked_pvc_path, original_s3_path, watermarked_s3_path, dt)

    # Update webcam db to set https_cam flag to True
    async with db_pool.acquire() as conn:
        await conn.execute("""
            UPDATE webcam_webcam
            SET https_cam = TRUE
            WHERE id = $1
        """, int(camera_id))
        
async def update_replay_json(camera_id: str, db_pool: any):
    results = await get_images_within(camera_id, db_pool, hours=24)

    ids = []
    for item in results:
        watermarked_path = item.watermarked_pvc_path
        filename = os.path.basename(watermarked_path)
        file_id, _ = os.path.splitext(filename)
        ids.append(file_id)

    # Create the JSON file
    logger.info(f"Updating JSON file for camera {camera_id} with {len(ids)} IDs")
    file_path = os.path.join(OUTPUT_DIR, f"{camera_id}.json")

    async with aiofiles.open(file_path, "w", encoding="utf-8") as f:
        data_str = json.dumps(ids, indent=4)
        await f.write(data_str)
    logger.info(f"JSON file for camera {camera_id} saved at {file_path}")

    return {
        "status": "success",
        "file_path": f"/ReplayTheDay/json/{camera_id}.json",
        "count": len(ids)
    }