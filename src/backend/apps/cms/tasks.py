import logging

from apps.cms.models import Advisory
from apps.event.enums import EVENT_DISPLAY_CATEGORY
from apps.event.tasks import (
    generate_district_settings_message,
    generate_settings_message,
    get_district_subscriptions,
    get_notification_routes,
)
from apps.shared.helpers import attach_default_email_images, attach_image_to_email
from apps.shared.models import Area
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def send_advisory_notifications(advisory_id):
    # Route
    for saved_route in get_notification_routes():
        send_route_advisory_notifications(saved_route, advisory_id)

    # Area
    updated_advisory = Advisory.objects.filter(id=advisory_id).first()
    if not updated_advisory or not updated_advisory.geometry:
        return

    intersecting_area_ids = Area.objects.filter(
        geometry__intersects=updated_advisory.geometry
    ).values_list('id', flat=True)

    area_subs = get_district_subscriptions(intersecting_area_ids).filter(
        notification_types__contains=[EVENT_DISPLAY_CATEGORY.ADVISORY],
        area_id__in=intersecting_area_ids
    ).select_related('user', 'area')

    # One email per user when multiple area subscriptions match
    subs_by_user = {}
    for sub in area_subs:
        subs_by_user.setdefault(sub.user_id, []).append(sub)

    for user_subs in subs_by_user.values():
        send_area_advisory_notifications(user_subs, updated_advisory)


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


def send_area_advisory_notifications(user_subs, advisory):
    if not user_subs:
        return

    # Area A, Area B and Area C or just Area A
    names = [sub.area.name for sub in user_subs]
    area_names = f"{', '.join(names[:-1])} and {names[-1]}" if len(names) > 1 else names[0]

    # Representative subscription for user/settings; subject lists all matching areas
    subscription = user_subs[0]

    footer_message = (
        'Based on your settings, you are being notified for all new and updated '
        f'information in {area_names}.'
    ) if len(user_subs) > 1 else generate_district_settings_message(subscription)

    context = {
        'advisory': advisory,
        'user': subscription.user,
        'area_names': area_names,
        'from_email': settings.DRIVEBC_FROM_EMAIL_DEFAULT,
        'site_link': advisory.site_link,
        'footer_message': footer_message,
        'fe_base_url': settings.FRONTEND_BASE_URL,
    }

    text = render_to_string('email/district_advisory_updated.txt', context)
    html = render_to_string('email/district_advisory_updated.html', context)

    msg = EmailMultiAlternatives(
        f'DriveBC: advisory update in {area_names}',
        text,
        settings.DRIVEBC_FROM_EMAIL_DEFAULT,
        [subscription.user.email]
    )

    # image attachments
    attach_default_email_images(msg)
    attach_image_to_email(msg, 'dclogo', 'advisory.png')

    msg.attach_alternative(html, 'text/html')
    msg.send()
