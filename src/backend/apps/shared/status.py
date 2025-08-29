from collections import deque
import os
from asgiref.sync import sync_to_async
from statistics import mean, stdev
from apps.consumer.models import ImageIndex
from datetime import datetime, timedelta, timezone
from typing import List, Tuple, Union
import math

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
        threshold_stale = mean_interval * 1.1
        threshold_delayed = mean_interval * 3

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

def get_image_list(camera_id, age="TIMELAPSE_HOURS"):
    camera_id = int(camera_id)
    hours = int(os.getenv(age))
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=hours)
    results = ImageIndex.objects.filter(camera_id=camera_id, timestamp__gte=cutoff).order_by('timestamp')
    timestamps = [item.timestamp.strftime("%Y%m%d%H%M%S") + ".jpg" for item in results]
    return timestamps