from typing import List, Optional, Dict
from email.mime.image import MIMEImage

import logging

logger = logging.getLogger(__name__)


class EmailMessage:
    def __init__(
        self,
        subject: str,
        body_text: str,
        from_email: str,
        to_emails: List[str],
        body_html: Optional[str] = None,
        attachments: Optional[Dict[str, bytes]] = None,
        inline_images: Optional[Dict[str, bytes]] = None,
    ):
        self.subject = subject
        self.body_text = body_text
        self.body_html = body_html
        self.from_email = from_email
        self.to_emails = to_emails
        self.attachments = attachments or {}
        self.inline_images = inline_images or {}


class SMTPEmailService:

    def send(self, message: EmailMessage) -> bool:
        try:
            from django.core.mail import EmailMultiAlternatives

            msg = EmailMultiAlternatives(
                subject=message.subject,
                body=message.body_text,
                from_email=message.from_email,
                to=message.to_emails,
            )

            # Add HTML version if provided
            if message.body_html:
                msg.attach_alternative(message.body_html, "text/html")

            # Add inline images
            for cid, image_bytes in message.inline_images.items():
                img = MIMEImage(image_bytes, _subtype="png")
                img.add_header("Content-ID", f"<{cid}>")
                img.add_header("X-Attachment-Id", cid)
                img.add_header("Content-Disposition", "inline", filename=cid)
                msg.attach(img)

            # Add regular attachments
            for filename, file_bytes in message.attachments.items():
                msg.attach(filename, file_bytes)

            msg.send()
            logger.info(f"Email sent successfully to {message.to_emails}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False

class AzureCommunicationsEmailService:
    def __init__(self):
        from django.conf import settings
        from azure.communication.email import EmailClient

        self.connection_string = getattr(settings, "AZURE_COMMUNICATIONS_CONNECTION_STRING", None)

        if not self.connection_string:
            raise ValueError(
                "Azure Communications connection string not configured. "
                "Set AZURE_COMMUNICATIONS_CONNECTION_STRING in settings."
            )

        self.client = EmailClient.from_connection_string(self.connection_string)

    def send(self, message: EmailMessage) -> bool:
        try:
            from azure.communication.email import EmailMessage as AzureEmailMessage
            from azure.communication.email import EmailAddress

            # Create Azure email message
            azure_message = AzureEmailMessage(
                sender=message.from_email,
                recipients=[EmailAddress(email=email) for email in message.to_emails],
                subject=message.subject,
                body_text=message.body_text,
            )

            # Add HTML version if provided
            if message.body_html:
                azure_message.body_html = message.body_html

            # Send the message
            poller = self.client.begin_send(azure_message)
            result = poller.result()

            logger.info(
                f"Email sent successfully via Azure to {message.to_emails}. "
                f"Message ID: {result.message_id}"
            )
            return True

        except Exception as e:
            logger.error(f"Failed to send email via Azure: {str(e)}")
            return False

class EmailServiceFactory:
    _services = {
        "smtp": SMTPEmailService,
        "azure": AzureCommunicationsEmailService,
    }

    def create(cls, service_name: str = None):
        from django.conf import settings

        service_name = getattr(settings, "EMAIL_SERVICE", None)
        service_name = service_name.lower()

        cls._validate_settings(settings, service_name)

        service_class = cls._services[service_name]
        return service_class()

    def _validate_settings(settings, service_name: str):
        if service_name not in cls._services:
            raise ValueError(
                f"Unknown email service: {service_name}. "
                f"Available services: {', '.join(cls._services.keys())}"
            )

        if not getattr(settings, "DRIVEBC_FROM_EMAIL_DEFAULT", None):
            raise ValueError(
                "DRIVEBC_FROM_EMAIL_DEFAULT not configured. Set DRIVEBC_FROM_EMAIL_DEFAULT in settings."
            )
        if service_name == "smtp":
            if not getattr(settings, "SMTP_HOST", None):
                raise ValueError(
                    "SMTP server not configured. Set SMTP_HOST in settings."
                )
            if not getattr(settings, "SMTP_PORT", None):
                raise ValueError(
                    "SMTP server port not configured. Set SMTP_PORT in settings."
                )
        elif service_name == "azure":
            if not getattr(settings, "AZURE_COMMUNICATIONS_CONNECTION_STRING", None):
                raise ValueError(
                    "AZURE_COMMUNICATIONS_CONNECTION_STRING not configured. "
                    "When using EMAIL_SERVICE='azure', this setting is required."
                )
