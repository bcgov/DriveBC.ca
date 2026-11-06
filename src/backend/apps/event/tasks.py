import datetime
import logging
from pathlib import Path
from zoneinfo import ZoneInfo

from apps.authentication.models import EmailSubscription, SavedRoutes
from apps.event.enums import (
    EVENT_DETAIL_FIELDS,
    EVENT_DIFF_FIELDS,
    EVENT_DISPLAY_CATEGORY,
    EVENT_DISPLAY_CATEGORY_TITLE,
    EVENT_SEVERITY,
    EVENT_STATUS,
    EVENT_TYPE,
    EVENT_UPDATE_FIELDS,
)
from apps.event.helpers import build_event_site_link, get_display_category
from apps.event.models import (
    Event,
    QueuedDistrictEventNotification,
    QueuedEventNotification,
)
from apps.event.ride import get_ride_events
from apps.event.serializers import EventInternalSerializer
from apps.shared.enums import CacheKey
from apps.shared.helpers import attach_default_email_images, attach_image_to_email
from apps.shared.models import Area
from django.conf import settings
from django.contrib.gis.geos import GEOSGeometry, LineString, Point
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import EmailMultiAlternatives
from django.db.models import Q
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)

# Backend dir and env
BACKEND_DIR = Path(__file__).resolve().parents[2]

# DBC22-7627: BC 'PCT' from Nov 1 2026 02:00 PDT
PCT_START = datetime.datetime(2026, 11, 1, 9, tzinfo=datetime.timezone.utc)


# DBC22-6954: event fields kept for change highlights and cleared emails
EVENT_STATE_FIELDS = [
    'id', 'description', 'event_type', 'event_sub_type', 'status', 'severity', 'closed',
    'direction', 'location', 'route_at', 'route_from', 'route_to', 'highway_segment_names',
    'location_description', 'closest_landmark', 'next_update', 'first_created', 'last_updated',
    'start', 'end', 'schedule', 'timezone', 'display_category', *EVENT_DETAIL_FIELDS,
]

# Fields highlighted in emails when changed; item sections diffed in item_changes
EVENT_HIGHLIGHT_FIELDS = ['location_description', 'closest_landmark', 'next_update', 'additional']


def get_event_state(event):
    return {
        field: getattr(event, field).ewkt if field == 'location' else getattr(event, field)
        for field in EVENT_STATE_FIELDS
    }


def event_from_state(state):
    return Event(**{
        field: GEOSGeometry(value) if field == 'location' else Event._meta.get_field(field).to_python(value)
        for field, value in state.items()
    })


def get_pacific_tz_label():
    if datetime.datetime.now(datetime.timezone.utc) >= PCT_START:
        return 'Pacific Time (PCT)'

    return 'Pacific Daylight Time (PDT)'


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

        # Pre-check location with simplification to match models.py behavior. This is to avoid unnecessary updates.
        if field == 'location' and \
                current_obj.event_type in [EVENT_TYPE.ROAD_CONDITION, EVENT_TYPE.WEATHER_CONDITION] and \
                isinstance(current_field_data, LineString) and \
                new_field_data and new_field_data.get('type') == 'LineString':
            ls = LineString(new_field_data['coordinates'], srid=4326)
            ls.transform(3857)
            ls = ls.simplify(50, preserve_topology=True)
            ls.transform(4326)
            if compare_data(current_field_data, ls):
                continue

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


def build_detail_diff(current_obj, new_obj_data):
    return {
        field: new_obj_data[field] for field in EVENT_DETAIL_FIELDS
        if field in new_obj_data and getattr(current_obj, field) != new_obj_data[field]
    }


def populate_event_from_data(new_event_data, previous_states=None):
    event_id = new_event_data.get('id')
    try:
        event = Event.objects.get(id=event_id)

        # Only update if existing data differs for at least one of the fields
        for field in EVENT_DIFF_FIELDS:
            old_data = getattr(event, field)
            new_data = new_event_data.get(field)
            if not compare_data(old_data, new_data):
                if previous_states is not None:
                    previous_states[event_id] = get_event_state(event)

                # Found diff, update and stop loop
                data_diff = {**build_data_diff(event, new_event_data), **build_detail_diff(event, new_event_data)}
                Event.objects.filter(id=event_id).update(**data_diff)

                # Refresh from DB and save to update display category
                event.refresh_from_db()
                event.save()

                # Update areas on location changes
                if 'location' in data_diff:
                    intersecting_areas = Area.objects.filter(geometry__intersects=event.location)
                    event.area.set(intersecting_areas)

                return True

        # Sync chain-up direction even when last_updated is unchanged
        # (parsed from route_from). Not notification-worthy.
        if event.event_type == EVENT_TYPE.CHAIN_UP:
            new_direction = new_event_data.get('direction')
            if new_direction and new_direction != event.direction:
                Event.objects.filter(id=event_id).update(direction=new_direction)

        # DBC22-6954: backfill RIDE details on existing events; not notification-worthy
        detail_diff = build_detail_diff(event, new_event_data)
        if detail_diff:
            Event.objects.filter(id=event_id).update(**detail_diff)

        # Update future events display category
        # https://moti-imb.atlassian.net/browse/DBC22-2259
        if event.display_category == EVENT_DISPLAY_CATEGORY.FUTURE_DELAYS:
            new_display_category = get_display_category(event)
            if new_display_category != EVENT_DISPLAY_CATEGORY.FUTURE_DELAYS:
                # Update without triggering save
                Event.objects.filter(id=event_id).update(display_category=new_display_category)
                return True

    except ObjectDoesNotExist:
        event = Event(id=event_id)
        event_serializer = EventInternalSerializer(event, data=new_event_data)
        event_serializer.is_valid(raise_exception=True)
        saved_event = event_serializer.save()

        # Update intersecting areas on create
        intersecting_areas = Area.objects.filter(geometry__intersects=event.location)
        saved_event.area.set(intersecting_areas)
        return True


def populate_all_event_data():
    # DBC22-7577: RIDE only, Open511 no longer used
    ride_events = get_ride_events()

    # DBC22-5979: skip task when result is empty
    if not len(ride_events):
        logger.warning('No RIDE events found, stopping task')
        return

    active_event_ids = []
    updated_event_ids = []
    previous_states = {}
    for event_data in ride_events:
        try:
            # Populate db obj
            updated = populate_event_from_data(event_data, previous_states)
            if updated:
                updated_event_ids.append(event_data['id'])

            # Mark event as active
            active_event_ids.append(event_data['id'])

        except Exception as e:
            logger.warning(e)

    # Purge events absent in the feed
    purged_events = Event.objects.filter(status=EVENT_STATUS.ACTIVE)\
        .exclude(id__in=active_event_ids)

    # DBC22-6954: queue cleared notifications while event rows still exist
    cleared_states = {event.id: get_event_state(event) for event in purged_events}
    queue_event_notifications(list(cleared_states), previous_states=cleared_states, cleared=True)

    purged_events.delete()

    # Rebuild cache
    cache.delete(CacheKey.EVENT_LIST)
    cache.delete(CacheKey.EVENT_LIST_POLLING)

    # Send notifications
    queue_event_notifications(updated_event_ids, previous_states=previous_states)


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


def get_district_subscriptions(areas, dt=None):
    current_dt = datetime.datetime.now(ZoneInfo('America/Vancouver')) if not dt else dt

    # Get the current day of the week and time
    current_day = current_dt.strftime('%A')
    current_date = current_dt.date()
    current_time = current_dt.time()

    # Get all saved subscriptions that have notifications enabled
    filtered_subscriptions = EmailSubscription.objects.filter(
        user__verified=True, user__consent=True, notification=True, area__in=areas

    ).filter(
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

    return filtered_subscriptions


def queue_event_notifications(updated_event_ids, dt=None, previous_states=None, cleared=False):
    previous_states = previous_states or {}

    for saved_route in get_notification_routes(dt=dt):
        queue_route_event_notifications(saved_route, updated_event_ids, previous_states, cleared)

    areas = Event.objects.filter(id__in=updated_event_ids).values_list('area', flat=True).distinct()
    for sub in get_district_subscriptions(areas, dt=dt):
        queue_district_event_notifications(sub, updated_event_ids, previous_states, cleared)


def generate_settings_message(route, test_time=None):
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
                f'and {route.notification_end_time.strftime("%I:%M%p").lower()} '
                f'{get_pacific_tz_label()} ')

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


def generate_district_settings_message(subscription, test_time=None):
    msg = (
        'Based on your settings, you are being notified for all new and updated '
        f'information in {subscription.area.name} '
    )

    # Immediately and all the time
    if not subscription.notification_start_time:
        msg += 'at any time.'

    else:
        msg += (f'between {subscription.notification_start_time.strftime("%I:%M%p").lower()} '
                f'and {subscription.notification_end_time.strftime("%I:%M%p").lower()} '
                f'{get_pacific_tz_label()} ')

        # Date range
        if subscription.notification_end_date:
            msg += (f'from {subscription.notification_start_date.strftime("%B %d")} '
                    f'to {subscription.notification_end_date.strftime("%B %d")}.')

        # Specific date
        elif subscription.notification_start_date:
            msg += f'on {subscription.notification_start_date.strftime("%B %d")}.'

        # Days of the week
        elif len(subscription.notification_days) == 7:
            msg += 'every day.'

        else:
            msg += f'every {", ".join(subscription.notification_days)}.'

    return msg


def queue_route_event_notifications(saved_route, updated_event_ids, previous_states=None, cleared=False):
    previous_states = previous_states or {}

    # Same 150m flattened-route buffer used when sending notifications
    buffered_route = merge_multilinestring(saved_route.route)

    updated_interecting_events = Event.objects.filter(
        id__in=updated_event_ids,
        location__intersects=buffered_route,
        display_category__in=saved_route.notification_types  # Only notify for selected event types
    )

    if cleared:
        # Cleared replaces any pending new/updated notification
        for event in updated_interecting_events:
            QueuedEventNotification.objects.update_or_create(
                route_id=saved_route.id,
                event_id=event.id,
                defaults={'previous_state': previous_states.get(event.id), 'cleared': True},
            )
        return

    # Existing rows win to keep the oldest previous state
    queued_notifications = [
        QueuedEventNotification(
            route_id=saved_route.id,
            event_id=event.id,
            previous_state=previous_states.get(event.id),
        )
        for event in updated_interecting_events
    ]
    QueuedEventNotification.objects.bulk_create(queued_notifications, ignore_conflicts=True)


def queue_district_event_notifications(sub, updated_event_ids, previous_states=None, cleared=False):
    previous_states = previous_states or {}
    new_event_ids = list(Event.objects.filter(
        id__in=updated_event_ids,
        area=sub.area,
        display_category__in=sub.notification_types
    ).values_list('id', flat=True))

    if not new_event_ids:
        return

    # Update queued notification with new event ids if it already exists
    queued = QueuedDistrictEventNotification.objects.filter(subscription_id=sub.id).first() or \
        QueuedDistrictEventNotification(subscription_id=sub.id)

    queued.event_ids = list(set(queued.event_ids or []) | set(new_event_ids))
    for event_id in new_event_ids:
        if cleared:
            queued.previous_states[event_id] = previous_states.get(event_id)

        else:
            # Keep the oldest previous state
            queued.previous_states.setdefault(event_id, previous_states.get(event_id))

    if cleared:
        queued.cleared_event_ids = list(set(queued.cleared_event_ids or []) | set(new_event_ids))

    queued.save()


def update_event_area_relations():
    for event in Event.objects.all():
        intersecting_areas = Area.objects.filter(geometry__intersects=event.location)
        event.area.set(intersecting_areas)


def flatten_route_linestring(multilinestring):
    """Flatten a MultiLineString into a single LineString (SRID unchanged)."""
    coords = []
    for line in multilinestring:
        coords.extend(line.coords)
    return LineString(coords, srid=multilinestring.srid)


def merge_multilinestring(multilinestring):
    """Return a 150m buffer (SRID 4326) around the flattened route."""
    ls = flatten_route_linestring(multilinestring)
    if ls.empty:
        return ls

    ls.transform(3857)
    buffered_route = ls.buffer(150)
    buffered_route.transform(4326)

    return buffered_route


def get_ordered_events(events, route):
    """Sort events by distance along the route (point location, else centroid)."""
    route_ls = flatten_route_linestring(route)
    if route_ls.empty:
        return list(events)

    def distance_along_route(event):
        loc = event.location
        if loc.empty:
            return float('inf')
        point = loc if loc.geom_type == 'Point' else loc.centroid
        if point.empty:
            return float('inf')
        return route_ls.project(point)

    return sorted(events, key=distance_along_route)


def set_notification_fields(event, previous_state=None, cleared=False, route=None):
    """Annotate event with email status, previous version and changed fields."""
    event.notification_status = 'Cleared' if cleared else 'Updated' if previous_state else 'New'
    event.previous = event_from_state(previous_state) if previous_state and not cleared else None
    event.changed = [
        field for field in EVENT_HIGHLIGHT_FIELDS
        if event.previous and getattr(event.previous, field) != getattr(event, field)
    ]
    event.site_link = None if cleared else build_event_site_link(event, route=route)
    return event


def get_event_subject_label(event):
    # DBC22-6954: closures omit the event type
    if event.display_category == EVENT_DISPLAY_CATEGORY.CLOSURE or event.severity == 'CLOSURE':
        return 'closure'

    if event.display_category == EVENT_DISPLAY_CATEGORY.ROAD_CONDITION:
        return 'road condition'

    if event.display_category == EVENT_DISPLAY_CATEGORY.CHAIN_UP:
        return 'commercial chain-up'

    severity = 'major' if event.severity == EVENT_SEVERITY.MAJOR else 'minor'
    event_type = 'incident' if event.event_type == EVENT_TYPE.INCIDENT else 'planned event'
    return f'{severity} {event_type}'


def get_event_subject(events, location_label):
    if len(events) > 1:
        return f'Updates to {len(events)} events {location_label}'

    return f'{events[0].notification_status} {get_event_subject_label(events[0])} {location_label}'


def send_event_emails(events, location_label, template_name, context, recipient):
    # DBC22-6954: closures sent in a separate email
    closures = [e for e in events if e.display_category == EVENT_DISPLAY_CATEGORY.CLOSURE]
    others = [e for e in events if e.display_category != EVENT_DISPLAY_CATEGORY.CLOSURE]

    for group in (closures, others):
        if not group:
            continue

        group_context = {
            **context,
            'events': group,
            'has_changes': any(event.changed for event in group),
        }
        text = render_to_string(f'email/{template_name}.txt', group_context)
        html = render_to_string(f'email/{template_name}.html', group_context)

        msg = EmailMultiAlternatives(
            get_event_subject(group, location_label),
            text,
            settings.DRIVEBC_FROM_EMAIL_SENDER,
            [recipient]
        )

        # image attachments
        attach_default_email_images(msg)
        for cid in ('map-pin', 'circle-dot', 'location-dot', 'impact-clock', 'impact-do-not-enter',
                    'impact-exclamation-circle', 'restriction-triangle', 'external-link'):
            attach_image_to_email(msg, cid, f'{cid}.png')

        file_names = get_unique_image_type_files_names(group)
        for fn in file_names:
            attach_image_to_email(msg, fn.split('.')[0], fn)  # use file name (without extension) as cid

        msg.attach_alternative(html, 'text/html')
        msg.send()


def send_queued_notifications():
    active_events = Event.objects.filter(status=EVENT_STATUS.ACTIVE)

    for route_id in QueuedEventNotification.objects.values_list('route_id', flat=True).distinct():
        saved_route = SavedRoutes.objects.filter(id=route_id).first()
        if saved_route:  # Skip is route is missing
            queued_notifications = QueuedEventNotification.objects.filter(route_id=saved_route.id)
            queued_by_event_id = {queued.event_id: queued for queued in queued_notifications}

            buffered_route = merge_multilinestring(saved_route.route)
            # Active + still near the route (drops stale queue rows / geometry drift)
            events = list(active_events.filter(
                id__in=[event_id for event_id, queued in queued_by_event_id.items() if not queued.cleared],
                location__intersects=buffered_route,
            ))

            # Cleared events no longer exist, rebuild from last state
            events += [
                event_from_state(queued.previous_state)
                for queued in queued_by_event_id.values()
                if queued.cleared and queued.previous_state
            ]

            ordered_events = get_ordered_events(events, saved_route.route)
            if not ordered_events:
                continue

            for event in ordered_events:
                queued = queued_by_event_id[event.id]
                set_notification_fields(event, queued.previous_state, queued.cleared, route=saved_route)

            context = {
                'route': saved_route,
                'user': saved_route.user,
                'from_email': settings.DRIVEBC_FROM_EMAIL_DEFAULT,
                'footer_message': generate_settings_message(saved_route),
                'fe_base_url': settings.FRONTEND_BASE_URL,
                'settings_path': 'my-routes',
                'settings_label': 'route',
            }

            route_label = saved_route.label if saved_route.label else f'{saved_route.start} to {saved_route.end}'
            send_event_emails(
                ordered_events, f'on {route_label}', 'event_updated', context, saved_route.user.email
            )

            # Clear sent notifications every loop
            queued_notifications.delete()


def send_queued_district_notifications():
    sent_notification_ids = []

    # All related DB objects
    all_queued_notifications = QueuedDistrictEventNotification.objects.all()

    all_subscription_ids = all_queued_notifications.values_list('subscription_id', flat=True).distinct()
    subscriptions_by_id = {
        sub.id: sub
        for sub in EmailSubscription.objects.filter(
            id__in=all_subscription_ids
        ).select_related('user', 'area')
    }

    all_event_ids = {
        event_id
        for ids in all_queued_notifications.values_list('event_ids', flat=True)
        for event_id in (ids or [])
    }
    active_events_by_id = {
        event.id: event
        for event in Event.objects.filter(
            id__in=all_event_ids,
            status=EVENT_STATUS.ACTIVE
        )
    }

    # Iterate and send each queued notification
    for queued_notification in all_queued_notifications:
        sent_notification_ids.append(queued_notification.id)

        subscription = subscriptions_by_id.get(queued_notification.subscription_id)
        if not subscription:
            continue

        previous_states = queued_notification.previous_states or {}
        cleared_event_ids = set(queued_notification.cleared_event_ids or [])

        events = []
        for event_id in queued_notification.event_ids:
            cleared = event_id in cleared_event_ids
            if cleared and previous_states.get(event_id):
                # Cleared events no longer exist, rebuild from last state
                event = event_from_state(previous_states[event_id])

            elif not cleared and event_id in active_events_by_id:
                event = active_events_by_id[event_id]

            else:
                continue

            events.append(set_notification_fields(event, previous_states.get(event_id), cleared))

        if len(events) == 0:
            continue

        sorted_events = sorted(events, key=lambda event: event.last_updated, reverse=True)

        context = {
            'subscription': subscription,
            'user': subscription.user,
            'area': subscription.area,
            'from_email': settings.DRIVEBC_FROM_EMAIL_DEFAULT,
            'footer_message': generate_district_settings_message(subscription),
            'fe_base_url': settings.FRONTEND_BASE_URL,
            'settings_path': 'my-areas',
            'settings_label': 'area',
        }

        send_event_emails(
            sorted_events, f'in {subscription.area.name}', 'event_updated', context,
            subscription.user.email
        )

    # Clear sent notifications
    QueuedDistrictEventNotification.objects.filter(id__in=sent_notification_ids).delete()
