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
from apps.event.helpers import get_display_category
from apps.event.models import Event, QueuedEventNotification
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
    queue_event_notifications(updated_event_ids)


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


def get_unique_image_type_files_names(events):
    unique_file_names = set()
    for event in events:
        unique_file_names.add(get_image_type_file_name(event))
    return list(unique_file_names)


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


def queue_event_notifications(updated_event_ids, dt=None):
    for saved_route in get_notification_routes(dt):
        queue_route_event_notifications(saved_route, updated_event_ids)


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


def queue_route_event_notifications(saved_route, updated_event_ids):
    # Apply a 150m buffer to the route geometry
    saved_route.route.transform(3857)
    buffered_route = saved_route.route.buffer(150)
    buffered_route.transform(4326)

    updated_interecting_events = Event.objects.filter(
        id__in=updated_event_ids,
        location__intersects=buffered_route,
        display_category__in=saved_route.notification_types  # Only notify for selected event types
    )

    queued_notifications = []
    if updated_interecting_events.count() > 0:
        for event in updated_interecting_events:
            queued_notifications.append(QueuedEventNotification(route_id=saved_route.id, event_id=event.id))

    QueuedEventNotification.objects.bulk_create(queued_notifications, ignore_conflicts=True)


def update_event_area_relations():
    for event in Event.objects.all():
        intersecting_areas = Area.objects.filter(geometry__intersects=event.location)
        event.area.set(intersecting_areas)


def merge_multilinestring(multilinestring):
    # Flatten all coordinates from each LineString in the MultiLineString
    coords = []
    for line in multilinestring:
        coords.extend(line.coords)
    ls = LineString(coords, srid=multilinestring.srid)

    # Apply a 150m buffer to the route geometry
    ls.transform(3857)
    buffered_route = ls.buffer(150)
    buffered_route.transform(4326)

    return buffered_route


def get_event_reference_point(event_location, route):
    # If event_location is a Point, return as is
    if event_location.geom_type == 'Point':
        return event_location

    # If event_location is a LineString, get intersection with route
    elif event_location.geom_type == 'LineString':
        intersection = event_location.intersection(route)
        # If intersection is a Point, return it
        if intersection.geom_type == 'Point':
            return intersection

        # If intersection is a MultiPoint or LineString, return centroid or first point
        elif intersection.geom_type in ['MultiPoint', 'LineString']:
            return intersection.centroid

    # Fallback: return centroid
    return event_location.centroid


def get_ordered_events(events, route):
    events = list(events)
    event_distances = []
    for event in events:
        # Get reference point from buffered route
        ref_point = get_event_reference_point(event.location, merge_multilinestring(route))
        distance = route.project(ref_point)
        event_distances.append((distance, event))

    # Sort events by distance along the route
    event_distances.sort(key=lambda x: x[0])
    ordered_events = [e for _, e in event_distances]

    return ordered_events


def send_queued_notifications():
    active_events = Event.objects.filter(status=EVENT_STATUS.ACTIVE)
    queued_notification_ids = []

    for route_id in QueuedEventNotification.objects.values_list('route_id', flat=True).distinct():
        saved_route = SavedRoutes.objects.filter(id=route_id).first()
        if saved_route:  # Skip is route is missing
            queued_notifications = QueuedEventNotification.objects.filter(route_id=saved_route.id)

            # Notifications to delete
            queued_notification_ids += queued_notifications.values_list('id', flat=True)

            queued_event_ids = queued_notifications.values_list('event_id', flat=True)
            events = active_events.filter(id__in=queued_event_ids)  # filter out inactive events
            ordered_events = get_ordered_events(events, saved_route.route)
            context = {
                'events': ordered_events,
                'route': saved_route,
                'user': saved_route.user,
                'from_email': settings.DRIVEBC_FROM_EMAIL_DEFAULT,
                'footer_message': generate_settings_message(saved_route),
                'fe_base_url': settings.FRONTEND_BASE_URL,
            }

            text = render_to_string('email/event_updated.txt', context)
            html = render_to_string('email/event_updated.html', context)

            update_text = 'updates' if len(ordered_events) > 1 else 'update'
            msg = EmailMultiAlternatives(
                f'DriveBC: {len(ordered_events)} {update_text} on {saved_route.label}',
                text,
                settings.DRIVEBC_FROM_EMAIL_DEFAULT,
                [saved_route.user.email]
            )

            # image attachments
            attach_default_email_images(msg)

            file_names = get_unique_image_type_files_names(events)
            for fn in file_names:
                attach_image_to_email(msg, fn.split('.')[0], fn)  # use file name (without extension) as cid

            msg.attach_alternative(html, 'text/html')
            msg.send()

    # Clear sent notifications
    QueuedEventNotification.objects.filter(id__in=queued_notification_ids).delete()
