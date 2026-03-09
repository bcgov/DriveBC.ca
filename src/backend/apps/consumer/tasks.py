import logging
import io

from apps.consumer.processor import process_camera_rows, watermark, save_watermarked_image_to_pvc, save_watermarked_image_to_drivebc_pvc, push_to_s3, insert_image_and_update_webcam
from datetime import datetime
from .db import get_all_from_db
import pytz
from PIL import Image

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
            watermarked = watermark(camera, dummy_image_bytes, tz, timestamp)
            
            if watermarked:
                # Convert timestamp to UTC for storage
                local_tz = pytz.timezone(tz)
                naive_dt = datetime.strptime(timestamp, "%Y%m%d%H%M%S%f")
                local_dt = local_tz.localize(naive_dt)
                utc_dt = local_dt.astimezone(pytz.utc)
                utc_timestamp_str = utc_dt.strftime("%Y%m%d%H%M%S")
                
                save_watermarked_image_to_pvc(camera_id, watermarked, utc_timestamp_str)
                save_watermarked_image_to_drivebc_pvc(camera_id, watermarked)
                push_to_s3(watermarked, camera_id, False, utc_timestamp_str)
                insert_image_and_update_webcam(camera_id, utc_dt, camera)