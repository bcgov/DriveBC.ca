import datetime
import os
from email.mime.image import MIMEImage
from pathlib import Path
from zoneinfo import ZoneInfo

# Backend dir and env
BACKEND_DIR = Path(__file__).resolve().parents[2]


def parse_and_localize_time_str(time):
    if not time:
        return

    dt = datetime.datetime.strptime(time, "%Y-%m-%d %H:%M:%S")
    localized_dt = dt.replace(tzinfo=ZoneInfo('America/Vancouver'))
    return localized_dt


# Attach images with Content-ID
def attach_image_to_email(msg, cid, filename):
    image_path = os.path.join(BACKEND_DIR, 'static', 'images', filename)
    with open(image_path, 'rb') as image_file:
        img = MIMEImage(image_file.read(), _subtype="png")
        img.add_header('Content-ID', f'<{cid}>')
        img.add_header('X-Attachment-Id', filename)
        img.add_header('Content-Disposition', 'inline', filename=filename)
        msg.attach(img)


def attach_default_email_images(msg):
    image_paths = {
        'drivebclogo': 'drivebclogo.png',
        'bclogo': 'bclogo.png',
        'twitter': 'twitter.png',
        'instagram': 'instagram.png',
        'linkedin': 'linkedin.png'
    }

    for cid, filename in image_paths.items():
        attach_image_to_email(msg, cid, filename)
