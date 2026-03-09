import logging
import io

from apps.consumer.processor import process_camera_rows, watermark, blank_out_image, save_watermarked_image_to_pvc, save_watermarked_image_to_drivebc_pvc, delete_watermarked_image_from_pvc, delete_offline_webcam_records
from datetime import datetime
from .db import get_all_from_db
import pytz
from PIL import Image
import pprint

from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)

def generate_offline_camera_images():
    """Generate placeholder images for offline cameras."""
    rows = get_all_from_db()
    cameras = process_camera_rows(rows)
    
    now = datetime.now()
    timestamp = now.strftime("%Y%m%d%H%M%S%f")
    
    for camera in cameras:
        if not camera.get('is_on', True):
            camera_id = str(camera['id'])
            tz = 'America/Vancouver'
            
            # Create a dummy image
            dummy_image = io.BytesIO()
            Image.new('RGB', (720, 498)).save(dummy_image, format='JPEG')
            dummy_image_bytes = dummy_image.getvalue()
            watermarked = blank_out_image(camera, dummy_image_bytes, tz, timestamp)
            
            if watermarked:
                # Convert timestamp to UTC for storage
                local_tz = pytz.timezone(tz)
                naive_dt = datetime.strptime(timestamp, "%Y%m%d%H%M%S%f")
                local_dt = local_tz.localize(naive_dt)
                utc_dt = local_dt.astimezone(pytz.utc)
                utc_timestamp_str = utc_dt.strftime("%Y%m%d%H%M%S")
                
                # Delete all the images for replay the day
                delete_watermarked_image_from_pvc(camera_id)
                # Delete all the records from image index table for offline cams
                async_to_sync(delete_offline_webcam_records)(camera_id)
                # Save blank image for replay the day
                save_watermarked_image_to_pvc(camera_id, watermarked, utc_timestamp_str, False)
                # Save blank image for current image displaying
                save_watermarked_image_to_drivebc_pvc(camera_id, watermarked, False)