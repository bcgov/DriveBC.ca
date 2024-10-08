import logging

from apps.event.enums import EVENT_DIFF_FIELDS, EVENT_STATUS, EVENT_UPDATE_FIELDS
from apps.event.models import Event
from apps.event.serializers import EventInternalSerializer
from apps.feed.client import FeedClient
from apps.shared.enums import CacheKey
from django.contrib.gis.geos import LineString, Point
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)


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
            if not compare_data(getattr(event, field), new_event_data[field]):
                # Found diff, update and stop loop
                data_diff = build_data_diff(event, new_event_data)
                Event.objects.filter(id=event_id).update(**data_diff)
                break

    except ObjectDoesNotExist:
        event = Event(id=event_id)
        event_serializer = EventInternalSerializer(event, data=new_event_data)
        event_serializer.is_valid(raise_exception=True)
        event_serializer.save()


def populate_all_event_data(include_closures=True):
    client = FeedClient()
    dit_data_dict = client.get_dit_event_dict() if include_closures else {}
    open511_data = client.get_event_list()['events']

    active_event_ids = []
    for event_data in open511_data:
        try:
            id = event_data.get("id", "").split("/")[-1]
            event_data["id"] = id

            # CARS data
            cars_data = dit_data_dict[id] if id in dit_data_dict else {}
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

            # Populate db obj
            populate_event_from_data(event_data)

            if id:  # Mark event as active
                active_event_ids.append(id)

        except Exception as e:
            logger.warning(e)

    # Purge events absent in the feed
    Event.objects.filter(status=EVENT_STATUS.ACTIVE)\
        .exclude(id__in=active_event_ids)\
        .delete()

    # Rebuild cache
    cache.delete(CacheKey.EVENT_LIST)
