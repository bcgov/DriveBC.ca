import logging

from apps.event.enums import EVENT_DIFF_FIELDS, EVENT_STATUS, EVENT_UPDATE_FIELDS
from apps.event.models import Event
from apps.event.serializers import EventSerializer
from apps.feed.client import FeedClient
from apps.shared.enums import CacheKey
from django.contrib.gis.geos import LineString, Point
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)


def compare_data(current_field_data, new_field_data):
    if isinstance(current_field_data, Point):
        new_point = Point(new_field_data['coordinates'])
        return current_field_data.equals(new_point)

    elif isinstance(current_field_data, LineString):
        new_ls = LineString(new_field_data['coordinates'])
        return current_field_data.equals(new_ls)

    else:
        return current_field_data == new_field_data


def build_data_diff(current_obj, new_obj_data):
    data_diff = {}
    for field in EVENT_UPDATE_FIELDS:
        current_field_data = getattr(current_obj, field)
        new_field_data = new_obj_data[field] if field in new_obj_data else None
        if not compare_data(current_field_data, new_field_data):
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
        event_serializer = EventSerializer(event, data=new_event_data)
        event_serializer.is_valid(raise_exception=True)
        event_serializer.save()


def populate_all_event_data():
    client = FeedClient()
    closures = client.get_closures_dict()
    feed_data = client.get_event_list()['events']

    active_event_ids = []
    for event_data in feed_data:
        id = event_data.get("id", "").split("/")[-1]
        event_data["closed"] = closures.get(id, False)

        populate_event_from_data(event_data)

        # Event is active
        if "id" in event_data:
            active_event_ids.append(event_data["id"])

    # Mark events absent in the feed as inactive
    Event.objects.filter(status=EVENT_STATUS.ACTIVE)\
        .exclude(id__in=active_event_ids)\
        .update(status=EVENT_STATUS.INACTIVE)

    # Rebuild cache
    cache.delete(CacheKey.EVENT_LIST)
