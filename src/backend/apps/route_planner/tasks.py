import logging
from datetime import timedelta

from apps.drivebc_api.drivebc_client import DrivebcClient
from apps.route_planner.models import Route
from django.conf import settings
from django.core.mail import EmailMessage
from django.utils import timezone
from httpx import HTTPStatusError, RequestError
from huey import crontab
from huey.contrib import djhuey as huey

logger = logging.getLogger(__name__)


@huey.periodic_task(crontab(minute="*/5"))
def send_route_event_notifications():
    """
    The task goes through all routes, checks if there are new events added in
    the border box of each of the routes, and sends an email
    if such an event was found.
    """
    for route in Route.objects.all():
        updated_at = timezone.now() - timedelta(minutes=5)
        bbox_string = ",".join(map(str, route.bbox))
        updated_str = updated_at.strftime("%Y-%m-%dT%H:%M:%SZ")
        try:
            events = DrivebcClient().get_events(
                limit=10, bbox=bbox_string, updated=updated_str
            )
        except (HTTPStatusError, RequestError) as e:
            logger.error(f"An error occurred when requesting for events: {e}")
            raise
        events = events.get("events", [])
        if events:
            for event in events:
                subject = f"Update to your saved route named {route.name}"
                headline = event.get("headline", "").replace("_", " ").capitalize()
                road_names = ", ".join(
                    [str(x.get("name", "")) for x in event.get("roads", [])]
                )
                html_content = (
                    f"<div>We want to let you know about a new road "
                    f"event that affects your saved route named "
                    f"{route.name}.</div>"
                    f"<h2>{headline}</h1>"
                    f"<h3>{road_names}</h2>"
                    f"<div>{event.get('description', '')}</div>"
                )

                msg = EmailMessage(
                    subject, html_content, settings.EMAIL_HOST_USER, [route.email]
                )
                msg.content_subtype = "html"
                msg.send()
