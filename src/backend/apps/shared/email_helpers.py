import os
from pathlib import Path
from typing import List, Dict

from django.conf import settings

from apps.shared.email_service import EmailMessage, EmailServiceFactory

# Backend dir for finding static images
BACKEND_DIR = Path(__file__).resolve().parents[2]

def send_email_message(
    subject: str,
    body_text: str,
    from_email: str,
    to_emails: List[str],
    body_html: str = None,
    attachments: Dict[str, bytes] = None,
    inline_images: Dict[str, bytes] = None,
) -> bool:
  
    message = EmailMessage(
        subject=subject,
        body_text=body_text,
        from_email=from_email,
        to_emails=to_emails,
        body_html=body_html,
        attachments=attachments,
        inline_images=inline_images,
    )

    # Get the configured email service
    email_service = EmailServiceFactory.create()
    return email_service.send(message)


def get_inline_image_bytes(filename: str) -> bytes:
    image_path = os.path.join(BACKEND_DIR, "static", "images", filename)
    with open(image_path, "rb") as image_file:
        return image_file.read()


def get_default_email_images() -> Dict[str, bytes]:
    image_names = {
        "drivebclogo": "drivebclogo.png",
        "bclogo": "bclogo.png",
        "twitter": "twitter.png",
        "instagram": "instagram.png",
        "linkedin": "linkedin.png",
    }

    images = {}
    for cid, filename in image_names.items():
        try:
            images[cid] = get_inline_image_bytes(filename)
        except FileNotFoundError:
            # Log warning but don't fail if an image is missing
            import logging

            logger = logging.getLogger(__name__)
            logger.warning(f"Email image not found: {filename}")

    return images
