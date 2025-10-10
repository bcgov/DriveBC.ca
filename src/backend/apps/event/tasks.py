import datetime
import logging
from pathlib import Path
from zoneinfo import ZoneInfo

from apps.authentication.models import SavedRoutes
from apps.event.enums import (
    EVENT_DIFF_FIELDS,
    EVENT_DISPLAY_CATEGORY,
    EVENT_DISPLAY_CATEGORY_TITLE,
    EVENT_STATUS,
    EVENT_TYPE,
    EVENT_UPDATE_FIELDS,
)
from apps.event.helpers import get_display_category, get_site_link
from apps.event.models import Event
from apps.event.serializers import EventInternalSerializer
from apps.feed.client import FeedClient
from apps.shared.enums import CacheKey
from apps.shared.helpers import attach_default_email_images, attach_image_to_email
from apps.shared.models import Area
from django.conf import settings
from django.contrib.gis.geos import LineString, Point
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import EmailMultiAlternatives
from django.db.models import Q
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)

# Backend dir and env
BACKEND_DIR = Path(__file__).resolve().parents[2]


def compare_data(current_field_data, new_field_data):
    if isinstance(current_field_data, Point):
        new_point = Point(new_field_data.get('coordinates'))\
            if not isinstance(new_field_data, Point) else new_field_data

        return current_field_data.equals(new_point)

    elif isinstance(current_field_data, LineString):
        new_ls = LineString(new_field_data.get('coordinates', []))\
            if not isinstance(new_field_data, LineString) else new_field_data

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
                    ls = LineString(new_field_data['coordinates'], srid=4326)
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
            old_data = getattr(event, field)
            new_data = new_event_data.get(field)
            if not compare_data(old_data, new_data):
                # Found diff, update and stop loop
                data_diff = build_data_diff(event, new_event_data)
                Event.objects.filter(id=event_id).update(**data_diff)

                # Refresh from DB and save to update display category
                event.refresh_from_db()
                event.save()

                # Update intersecting areas only when location changes
                if field == 'location':
                    intersecting_areas = Area.objects.filter(geometry__intersects=event.location)
                    event.area.set(intersecting_areas)

                return True

        # Update future events display category
        # https://moti-imb.atlassian.net/browse/DBC22-2259
        if event.display_category == EVENT_DISPLAY_CATEGORY.FUTURE_DELAYS:
            new_display_category = get_display_category(event)
            if new_display_category != EVENT_DISPLAY_CATEGORY.FUTURE_DELAYS:
                # Update without triggering save
                Event.objects.filter(id=event_id).update(display_category=new_display_category)

    except ObjectDoesNotExist:
        event = Event(id=event_id)
        event_serializer = EventInternalSerializer(event, data=new_event_data)
        event_serializer.is_valid(raise_exception=True)
        saved_event = event_serializer.save()

        # Update intersecting areas on create
        intersecting_areas = Area.objects.filter(geometry__intersects=event.location)
        saved_event.area.set(intersecting_areas)
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
        # Active
        active_event_ids.append(chain_up.validated_data['id'])

        # Updated
        updated = populate_event_from_data(chain_up.validated_data)
        if updated:
            updated_event_ids.append(chain_up.validated_data['id'])

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
        EVENT_DISPLAY_CATEGORY.FUTURE_DELAYS: 'future.png',
        EVENT_DISPLAY_CATEGORY.CHAIN_UP: 'chain-up.png'
    }

    if event.display_category == EVENT_DISPLAY_CATEGORY.MAJOR_DELAYS:
        return major_delay_icon_map.get(event.event_type, 'incident-minor.png')

    elif event.display_category == EVENT_DISPLAY_CATEGORY.MINOR_DELAYS:
        return minor_delay_icon_map.get(event.event_type, 'incident-minor.png')

    else:
        return icon_name_map.get(event.display_category, 'incident-minor.png')


def get_notification_routes(dt=None):
    current_dt = datetime.datetime.now(ZoneInfo('America/Vancouver')) if not dt else dt

    # Get the current day of the week and time
    current_day = current_dt.strftime('%A')
    current_date = current_dt.date()
    current_time = current_dt.time()

    # Get all saved routes that have notifications enabled
    filtered_routes = SavedRoutes.objects.filter(user__verified=True, user__consent=True, notification=True).filter(
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

    return filtered_routes


def send_event_notifications(updated_event_ids, dt=None):
    for saved_route in get_notification_routes(dt):
        send_route_event_notifications(saved_route, updated_event_ids)


def generate_settings_message(route, test_time=None):
    current_time = test_time or datetime.datetime.now(ZoneInfo('America/Vancouver'))
    isDst = current_time.dst().total_seconds() > 0
    msg = 'Based on your settings, you are being notified for all new and updated '

    # Add event types
    if route.notification_types and len(route.notification_types) == 5:
        msg += 'information '

    else:
        types = [EVENT_DISPLAY_CATEGORY_TITLE[t] for t in route.notification_types]
        if len(types) > 2:
            msg += f'{", ".join(types[:-1])}, and {types[-1]} '
        elif len(types) == 2:
            msg += f'{types[0]} and {types[1]} '
        else:
            msg += f'{types[0]} '

    msg += 'that affects your route '

    # Add date/time
    # Immediately and all the time
    if not route.notification_start_time:
        msg += 'at any time.'

    else:
        msg += (f'between {route.notification_start_time.strftime("%I:%M%p").lower()} '
                f'and {route.notification_end_time.strftime("%I:%M%p").lower()} ')

        msg += 'Pacific Standard Time (PST) ' if not isDst else 'Pacific Daylight Time (PDT) '

        # Specific date
        if route.notification_end_date:
            msg += (f'from {route.notification_start_date.strftime("%B %d")} '
                    f'and {route.notification_end_date.strftime("%B %d")}.')

        # Date range
        elif route.notification_start_date:
            msg += f'on {route.notification_start_date.strftime("%B %d")}.'

        # Days of the week
        elif len(route.notification_days) == 7:
            msg += 'every day.'

        else:
            msg += f'every {", ".join(route.notification_days)}.'

    return msg


def send_route_event_notifications(saved_route, updated_event_ids):
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
                'from_email': settings.DRIVEBC_FROM_EMAIL_DEFAULT,
                'display_category': event.display_category,
                'display_category_title': event.display_category_title,
                'site_link': get_site_link(event, saved_route),
                'footer_message': generate_settings_message(saved_route),
                'fe_base_url': settings.FRONTEND_BASE_URL,
            }

            text = render_to_string('email/event_updated.txt', context)
            html = render_to_string('email/event_updated.html', context)

            msg = EmailMultiAlternatives(
                f'DriveBC route update: {saved_route.label}' if saved_route.label else 'DriveBC route update',
                text,
                settings.DRIVEBC_FROM_EMAIL_DEFAULT,
                [saved_route.user.email]
            )

            # image attachments
            attach_default_email_images(msg)
            attach_image_to_email(msg, 'dclogo', get_image_type_file_name(event))

            msg.attach_alternative(html, 'text/html')
            msg.send()


def update_event_area_relations():
    for event in Event.objects.all():
        intersecting_areas = Area.objects.filter(geometry__intersects=event.location)
        event.area.set(intersecting_areas)
