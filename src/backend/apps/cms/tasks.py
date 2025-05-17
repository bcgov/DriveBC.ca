import logging

from apps.cms.models import Advisory
from apps.event.tasks import generate_settings_message, get_notification_routes
from apps.shared.helpers import attach_default_email_images, attach_image_to_email
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def send_advisory_notifications(advisory_id):
    for saved_route in get_notification_routes():
        send_route_advisory_notifications(saved_route, advisory_id)


def send_route_advisory_notifications(saved_route, updated_advisory_id):
    # Apply a 150m buffer to the route geometry
    saved_route.route.transform(3857)
    buffered_route = saved_route.route.buffer(150)
    buffered_route.transform(4326)

    updated_interecting_advisories = Advisory.objects.filter(
        id=updated_advisory_id,
        geometry__intersects=buffered_route
    )

    if updated_interecting_advisories.count() > 0:
        for advisory in updated_interecting_advisories:
            context = {
                'advisory': advisory,
                'route': saved_route,
                'user': saved_route.user,
                'from_email': settings.DRIVEBC_FROM_EMAIL_DEFAULT,
                'site_link': advisory.site_link,
                'footer_message': generate_settings_message(saved_route),
                'fe_base_url': settings.FRONTEND_BASE_URL,
            }

            text = render_to_string('email/advisory_updated.txt', context)
            html = render_to_string('email/advisory_updated.html', context)

            msg = EmailMultiAlternatives(
                f'DriveBC route update: {saved_route.label}' if saved_route.label else 'DriveBC route update',
                text,
                settings.DRIVEBC_FROM_EMAIL_DEFAULT,
                [saved_route.user.email]
            )

            # image attachments
            attach_default_email_images(msg)
            attach_image_to_email(msg, 'dclogo', 'advisory.png')

            msg.attach_alternative(html, 'text/html')
            msg.send()
