from collections import deque
import os
from asgiref.sync import sync_to_async
from statistics import mean, stdev
from apps.consumer.models import ImageIndex
from datetime import datetime, timedelta, timezone
from typing import List, Tuple, Union
import math
from botocore.config import Config
import boto3

# Max samples to calculate camera status
max_samples = 50

# Global rolling window of timestamps
timestamp_list: deque[Union[str, float]] = deque(maxlen=max_samples)

# @sync_to_async
def get_recent_timestamps(camera_id: int):
    latest_50 = ImageIndex.objects.filter(camera_id=str(camera_id)).order_by('-timestamp')[:50]  
    timestamp_list.clear()

    for obj in reversed(latest_50):
        timestamp = obj.timestamp.strftime("%Y%m%d%H%M%S") + f"{int(obj.timestamp.microsecond / 1000):03d}"
        timestamp_list.append(timestamp)
    return timestamp_list[-1] if timestamp_list else None

def parse_timestamp(ts_str: str) -> float:
    # Split into base datetime and milliseconds
    base_str = ts_str[:14]  # YYYYMMDDHHMMSS
    millis_str = ts_str[14:]  # FFF (3 digits)

    dt = datetime.strptime(base_str, "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)
    millis = int(millis_str)
    return dt.timestamp() + millis / 1000.0

def migrate_timestamp_list():
    """Ensure all values in timestamp_list are floats (convert from string if needed)."""
    for i in range(len(timestamp_list)):
        if isinstance(timestamp_list[i], str):
            timestamp_list[i] = parse_timestamp(timestamp_list[i])

def calculate_stddev(values: List[float]) -> float:
    return stdev(values) if len(values) > 1 else 0.0

def calculate_camera_status(timestamp_str: str) -> tuple[float, float]:
    """
    Add new timestamp and calculate median/stddev of update periods.

    Args:
        timestamp_str: Timestamp string in format 'YYYYMMDDHHMMSSFFF'

    Returns:
        timestamp: Current timestamp in milliseconds
        median (float): Median update period in seconds
        std_dev (float): Standard deviation in seconds (capped)
        stale (bool): True if median > threshold_stale
        delayed (bool): True if median > threshold_delayed
    """
    # Step 1: parse latest timestamp
    new_ts = parse_timestamp(timestamp_str)

    # Step 2: ensure all timestamps are float
    migrate_timestamp_list()

    # Step 3: process update periods
    c = len(timestamp_list) - 1
    if c > 2:
        sorted_times = sorted(timestamp_list, reverse=True)

        update_periods = [
            sorted_times[i] - sorted_times[i + 1]
            for i in range(c)
        ]

        update_periods.sort()
        trim = math.floor(0.125 * c)
        trimmed = update_periods[trim : c - trim]

        std_dev = calculate_stddev(trimmed)

        mean_interval = sum(trimmed) / len(trimmed)

        # 2. thresholds
        threshold_stale = max(mean_interval * 1.1, mean_interval + 2 * std_dev)
        threshold_delayed = 2 * mean_interval + 2 * std_dev

        # 3. actual time since last image
        time_since_last = new_ts - timestamp_list[-1]

        # 4. stale/delayed flags
        stale = time_since_last > threshold_stale
        delayed = time_since_last > threshold_delayed

    else:
        mean_interval = 300.0
        std_dev = 0.0
        stale = False
        delayed = False

    return {
        "timestamp": new_ts, # current timestamp in milliseconds
        "mean_interval": mean_interval,
        "stddev_interval": std_dev,
        "stale": stale,
        "delayed": delayed,
    }

def get_image_list_from_db(camera_id, age="TIMELAPSE_HOURS"):
    camera_id = int(camera_id)
    hours = int(os.getenv(age))
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=hours)
    results = ImageIndex.objects.filter(camera_id=camera_id, timestamp__gte=cutoff).order_by('timestamp')
    timestamps = [item.timestamp.strftime("%Y%m%d%H%M%S") for item in results]
    return timestamps
    
def get_image_list(camera_id, age="TIMELAPSE_HOURS"):
    if age == "TIMELAPSE_HOURS":
        return get_image_list_from_s3(camera_id, age)
    else:
        return get_image_list_from_db(camera_id, age)

def get_image_list_from_s3(camera_id, age="TIMELAPSE_HOURS"):
    camera_id = int(camera_id)
    hours = int(os.getenv(age, 24))
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=hours)
    S3_BUCKET = os.getenv("S3_BUCKET")
    S3_REGION = os.getenv("S3_REGION", "us-east-1")
    S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
    S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
    S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL", "")

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
    
    bucket_name = S3_BUCKET
    prefix = f"webcams/timelapse/{camera_id}/"  # adjust based on your folder structure
    
    # List objects in S3 under the prefix
    all_objects = []
    continuation_token = None

    while True:
        if continuation_token:
            response = s3_client.list_objects_v2(
                Bucket=bucket_name, Prefix=prefix, ContinuationToken=continuation_token
            )
        else:
            response = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=prefix)
        
        objects = response.get("Contents", [])
        all_objects.extend(objects)
        
        if response.get("IsTruncated"):  # there are more objects
            continuation_token = response.get("NextContinuationToken")
        else:
            break
    
    # Filter objects by timestamp in key
    timestamps = []
    for obj in all_objects:
        key = obj["Key"]  # e.g., "images/123/20250912050045.jpg"
        # extract timestamp part
        timestamp_str = key.split("/")[-1].split(".")[0]  # "20250912050045"
        dt = datetime.strptime(timestamp_str, "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)
        if dt >= cutoff:
            timestamps.append(timestamp_str)
    
    # Sort ascending by timestamp
    timestamps.sort()
    return timestamps