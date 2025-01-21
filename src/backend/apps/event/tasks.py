import datetime
import logging
import os
from email.mime.image import MIMEImage
from pathlib import Path
from zoneinfo import ZoneInfo

import environ
from apps.authentication.models import SavedRoutes
from apps.event.enums import (
    EVENT_DIFF_FIELDS,
    EVENT_DISPLAY_CATEGORY,
    EVENT_STATUS,
    EVENT_TYPE,
    EVENT_UPDATE_FIELDS,
)
from apps.event.models import Event
from apps.event.serializers import EventInternalSerializer
from apps.feed.client import FeedClient
from apps.shared.enums import CacheKey
from django.contrib.gis.geos import LineString, Point
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import EmailMultiAlternatives
from django.db.models import Q
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)

# Backend dir and env
BACKEND_DIR = Path(__file__).resolve().parents[2]
env = environ.Env()


def compare_data(current_field_data, new_field_data):
    if isinstance(current_field_data, Point):
        new_point = Point(new_field_data.get('coordinates'))
        return current_field_data.equals(new_point)

    elif isinstance(current_field_data, LineString):
        new_ls = LineString(new_field_data.get('coordinates', []))
        return current_field_data.equals(new_ls)

    else:
        return current_field_data == new_field_data


def build_data_diff(current_obj, new_obj_data):
    data_diff = {}
    for field in EVENT_UPDATE_FIELDS:
        current_field_data = getattr(current_obj, field)
        new_field_data = new_obj_data.get(field)
        if not compare_data(current_field_data, new_field_data):
            if field == 'location':
                # {'coordinates': [-122.601346, 49.143921], 'type': 'Point'}
                if new_field_data['type'] == 'Point':
                    data_diff[field] = Point(new_field_data['coordinates'])
                    data_diff['polygon'] = None

                else:
                    ls = LineString(new_field_data['coordinates'])
                    data_diff[field] = ls

                    # Add buffer to road condition linestrings
                    if new_obj_data['id'].startswith('DBCRCON'):
                        ls.transform(3857)  # Transform to 3857 before adding buffer
                        data_diff['polygon'] = ls.buffer_with_style(2000, end_cap_style=2)  # Add 2km buffer

                        # transform back to 4326 before updating
                        ls.transform(4326)
                        data_diff['polygon'].transform(4326)

                    else:
                        data_diff['polygon'] = None

            else:
                data_diff[field] = new_field_data

    return data_diff


def populate_event_from_data(new_event_data):
    event_id = new_event_data.get('id')
    try:
        event = Event.objects.get(id=event_id)

        # Only update if existing data differs for at least one of the fields
        for field in EVENT_DIFF_FIELDS:
            if not compare_data(getattr(event, field), new_event_data.get(field)):
                # Found diff, update and stop loop
                data_diff = build_data_diff(event, new_event_data)
                Event.objects.filter(id=event_id).update(**data_diff)
                return True

    except ObjectDoesNotExist:
        event = Event(id=event_id)
        event_serializer = EventInternalSerializer(event, data=new_event_data)
        event_serializer.is_valid(raise_exception=True)
        event_serializer.save()
        return True


def cap_time_to_now(datetime_value):
    # Use current time instead of future time
    if datetime_value and datetime_value > datetime.datetime.now(ZoneInfo('UTC')):
        return datetime.datetime.now(ZoneInfo('America/Vancouver'))

    return datetime_value


def populate_all_event_data():
    client = FeedClient()
    closures, chain_ups = client.get_dit_event_dict()
    open511_data = client.get_event_list()['events']

    active_event_ids = []
    updated_event_ids = []
    for event_data in open511_data:
        try:
            id = event_data.get("id", "").split("/")[-1]
            event_data["id"] = id

            # CARS data
            cars_data = closures[id] if id in closures else {}
            event_data["closed"] = cars_data.get('closed', False)
            event_data["highway_segment_names"] = cars_data.get('highway_segment_names', '')

            location_description = cars_data.get('location_description', '')
            location_extent = cars_data.get('location_extent', '')
            if location_extent:
                location_description += ' for ' + location_extent

            event_data["location_description"] = location_description
            event_data["closest_landmark"] = cars_data.get('closest_landmark', '')
            event_data["next_update"] = cars_data.get('next_update', None)
            event_data["start_point_linear_reference"] = cars_data.get('start_point_linear_reference', None)
            if 'route_at' in cars_data and cars_data['route_at'] != '':
                event_data["route_at"] = cars_data['route_at']
            # DBC22-3081 replace timezone with DIT API data, to be removed if source is corrected
            if 'timezone' in cars_data and cars_data['timezone']:
                new_tz = ZoneInfo(cars_data['timezone'])
                event_data['timezone'] = cars_data['timezone']

                first_created_time = event_data["first_created"].replace(tzinfo=new_tz)
                event_data["first_created"] = cap_time_to_now(first_created_time)

                last_updated_time = event_data["last_updated"].replace(tzinfo=new_tz)
                event_data["last_updated"] = cap_time_to_now(last_updated_time)

                if "start" in event_data:
                    pacific_start_time = event_data["start"].astimezone(ZoneInfo('America/Vancouver'))
                    event_data["start"] = pacific_start_time.replace(tzinfo=new_tz)

                if "end" in event_data:
                    pacific_end_time = event_data["end"].astimezone(ZoneInfo('America/Vancouver'))
                    event_data["end"] = pacific_end_time.replace(tzinfo=new_tz)
            else:
                event_data['timezone'] = 'America/Vancouver'

            # Populate db obj
            updated = populate_event_from_data(event_data)
            if updated:
                updated_event_ids.append(event_data['id'])

            if id:  # Mark event as active
                active_event_ids.append(id)

        except Exception as e:
            logger.warning(e)

    for chain_up in chain_ups:
        active_event_ids.append(chain_up.validated_data['id'])
        chain_up.save()

    # Purge events absent in the feed
    Event.objects.filter(status=EVENT_STATUS.ACTIVE)\
        .exclude(id__in=active_event_ids)\
        .delete()

    # Rebuild cache
    cache.delete(CacheKey.EVENT_LIST)
    cache.delete(CacheKey.EVENT_LIST_POLLING)

    # Send notifications
    send_event_notifications(updated_event_ids)


def get_image_type_file_name(event):
    major_delay_icon_map = {
        EVENT_TYPE.CONSTRUCTION: 'construction-major.png',
        EVENT_TYPE.INCIDENT: 'incident-major.png',
    }

    minor_delay_icon_map = {
        EVENT_TYPE.CONSTRUCTION: 'construction-minor.png',
        EVENT_TYPE.INCIDENT: 'incident-minor.png'
    }

    icon_name_map = {
        EVENT_DISPLAY_CATEGORY.CLOSURE: 'closure.png',
        EVENT_DISPLAY_CATEGORY.ROAD_CONDITION: 'road.png',
        EVENT_DISPLAY_CATEGORY.FUTURE_DELAYS: 'future.png'
    }

    if event.display_category == EVENT_DISPLAY_CATEGORY.MAJOR_DELAYS:
        return major_delay_icon_map.get(event.event_type, 'incident-minor.png')

    elif event.display_category == EVENT_DISPLAY_CATEGORY.MINOR_DELAYS:
        return minor_delay_icon_map.get(event.event_type, 'incident-minor.png')

    else:
        return icon_name_map.get(event.display_category, 'incident-minor.png')


def send_event_notifications(updated_event_ids, dt=None):
    current_dt = datetime.datetime.now(ZoneInfo('America/Vancouver')) if not dt else dt

    # Get the current day of the week and time
    current_day = current_dt.strftime('%A')
    current_date = current_dt.date()
    current_time = current_dt.time()

    # Get all saved routes that have notifications enabled
    filtered_routes = SavedRoutes.objects.filter(user__verified=True, notification=True).filter(
        # Routes that are always active
        Q(notification_start_time=None) |

        # Routes that match day of week and time frame
        Q(notification_days__contains=[current_day],
          notification_start_time__lte=current_time, notification_end_time__gte=current_time) |

        # Routes that match date period and time frame
        Q(notification_start_date__lte=current_date, notification_end_date__gte=current_date,
          notification_start_time__lte=current_time, notification_end_time__gte=current_time) |

        # Routes that match specific date and time frame
        Q(notification_start_date=current_date, notification_end_date=None,
          notification_start_time__lte=current_time, notification_end_time__gte=current_time)
    )

    for saved_route in filtered_routes:
        send_route_notifications(saved_route, updated_event_ids)


def send_route_notifications(saved_route, updated_event_ids):
    # Apply a 150m buffer to the route geometry
    saved_route.route.transform(3857)
    buffered_route = saved_route.route.buffer(150)
    buffered_route.transform(4326)

    updated_interecting_events = Event.objects.filter(
        id__in=updated_event_ids,
        location__intersects=buffered_route,
        display_category__in=saved_route.notification_types  # Only notify for selected event types
    )

    if updated_interecting_events.count() > 0:
        for event in updated_interecting_events:
            context = {
                'event': event,
                'route': saved_route,
                'user': saved_route.user,
                'from_email': env("DRIVEBC_FEEDBACK_EMAIL_DEFAULT"),
                'display_category': event.display_category,
                'display_category_title': event.display_category_title
            }

            text = render_to_string('email/event_updated.txt', context)
            html = render_to_string('email/event_updated.html', context)

            msg = EmailMultiAlternatives(
                f'DriveBC route update: {saved_route.label}' if saved_route.label else 'DriveBC route update',
                text,
                env("DRIVEBC_FEEDBACK_EMAIL_DEFAULT"),
                [saved_route.user.email]
            )

            # Attach images with Content-ID
            logo_path = os.path.join(BACKEND_DIR, 'static', 'images', 'drivebclogo.png')
            with open(logo_path, 'rb') as image_file:
                img = MIMEImage(image_file.read(), _subtype="png")
                img.add_header('Content-ID', '<drivebclogo>')
                img.add_header('X-Attachment-Id', 'drivebclogo.png')
                img.add_header('Content-Disposition', 'inline', filename='drivebclogo.png')
                msg.attach(img)

            icon_path = os.path.join(BACKEND_DIR, 'static', 'images', get_image_type_file_name(event))
            with open(icon_path, 'rb') as logo_img_file:
                logoimg = MIMEImage(logo_img_file.read(), _subtype="png")
                logoimg.add_header('Content-ID', '<dclogo>')
                logoimg.add_header('X-Attachment-Id', 'dclogo.png')
                logoimg.add_header('Content-Disposition', 'inline', filename='dclogo.png')
                msg.attach(logoimg)

            msg.attach_alternative(html, 'text/html')
            msg.send()
