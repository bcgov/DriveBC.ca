from django.core.mail.backends.base import BaseEmailBackend
from django.conf import settings
from azure.communication.email import EmailClient
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import HttpResponseError, AzureError
import base64
import logging

logger = logging.getLogger(__name__)

class AzureCommunicationEmailBackend(BaseEmailBackend):
    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        
        connection_string = getattr(settings, 'AZURE_COMMUNICATION_CONNECTION_STRING', None)
        
        if connection_string:
            self.client = EmailClient.from_connection_string(connection_string)
        else:
            endpoint = settings.AZURE_COMMUNICATION_ENDPOINT
            credential = AzureKeyCredential(settings.AZURE_COMMUNICATION_KEY)
            self.client = EmailClient(endpoint, credential)
    
    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        
        num_sent = 0
        for message in email_messages:
            sent = self._send(message)
            if sent:
                num_sent += 1
        return num_sent
    
    def _send(self, email_message):
        if not email_message.recipients():
            return False
        
        try:
            # Extract HTML from alternatives if present
            html_body = None
            plain_body = email_message.body
            
            if hasattr(email_message, 'alternatives') and email_message.alternatives:
                for content, mimetype in email_message.alternatives:
                    if mimetype == 'text/html':
                        html_body = content
                        break
            
            # Build the email content
            content = {
                "subject": email_message.subject,
                "plainText": plain_body,
                "html": html_body,
            }
            
            # Build recipients
            recipients = {
                "to": [{"address": addr} for addr in email_message.to],
            }
            
            if email_message.cc:
                recipients["cc"] = [{"address": addr} for addr in email_message.cc]
            
            if email_message.bcc:
                recipients["bcc"] = [{"address": addr} for addr in email_message.bcc]
            
            # Create the email message
            message = {
                "senderAddress": email_message.from_email or settings.DEFAULT_FROM_EMAIL,
                "recipients": recipients,
                "content": content,
            }
            
            # Handle attachments and inline images
            if email_message.attachments:
                message["attachments"] = []
                
                for attachment in email_message.attachments:
                    if hasattr(attachment, 'get_content_type'):
                        mime_obj = attachment
                        content_id = mime_obj.get('Content-ID', '').strip('<>')
                        
                        attachment_data = {
                            "name": mime_obj.get_filename() or 'attachment',
                            "contentType": mime_obj.get_content_type(),
                            "contentInBase64": base64.b64encode(
                                mime_obj.get_payload(decode=True)
                            ).decode('utf-8')
                        }
                        
                        if content_id:
                            attachment_data["contentId"] = content_id
                        
                        message["attachments"].append(attachment_data)
                    
                    elif isinstance(attachment, tuple):
                        filename, content, mimetype = attachment
                        
                        if isinstance(content, str):
                            content_b64 = content
                        else:
                            content_b64 = base64.b64encode(content).decode('utf-8')
                        
                        message["attachments"].append({
                            "name": filename,
                            "contentType": mimetype,
                            "contentInBase64": content_b64
                        })
            
            # Send the email
            poller = self.client.begin_send(message)
            result = poller.result()
            
            message_id = result.get('id') if isinstance(result, dict) else getattr(result, 'id', 'Unknown')
            logger.info(f"Email sent successfully to {email_message.to}. Message ID: {message_id}")
            return True
        
        except HttpResponseError as e:
            # Parse Azure-specific errors
            error_code = getattr(e.error, 'code', 'Unknown')
            error_message = str(e)
            
            # Log different error types
            if error_code == 'EmailDroppedAllRecipientsSuppressed':
                logger.warning(
                    f"Email to {email_message.to} was suppressed (invalid/bounced address). "
                    f"Subject: {email_message.subject}"
                )
            elif error_code == 'Unauthorized':
                logger.error(
                    f"Azure authentication failed. Check your credentials. "
                    f"Error: {error_message}"
                )
            elif error_code == 'Forbidden':
                logger.error(
                    f"Sender domain not verified in Azure. "
                    f"From: {email_message.from_email}, Error: {error_message}"
                )
            elif e.status_code == 429:
                logger.error(
                    f"Rate limit exceeded. "
                    f"Error: {error_message}"
                )
            else:
                logger.error(
                    f"Azure API error [{error_code}]: {error_message}. "
                    f"To: {email_message.to}, Subject: {email_message.subject}"
                )
            
            if not self.fail_silently:
                raise
            return False
        
        except AzureError as e:
            logger.error(f"Azure service error: {str(e)}")
            if not self.fail_silently:
                raise
            return False
        
        except Exception as e:
            logger.error(
                f"Unexpected error sending email to {email_message.to}: {str(e)}",
                exc_info=True
            )
            if not self.fail_silently:
                raise
            return False