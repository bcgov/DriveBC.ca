import logging

from apps.event.enums import EVENT_DIFF_FIELDS, EVENT_STATUS
from apps.event.models import Event
from apps.event.serializers import EventSerializer
from apps.feed.client import FeedClient
from apps.shared.enums import CacheKey
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)


def populate_event_from_data(event_data):
    event_id = event_data.get('id')

    try:
        event = Event.objects.get(id=event_id)

    except ObjectDoesNotExist:
        event = Event(id=event_id)

    # Only update if existing data differs for at least one of the fields
    for field in EVENT_DIFF_FIELDS:
        if getattr(event, field) != event_data[field]:
            event_serializer = EventSerializer(event, data=event_data)
            event_serializer.is_valid(raise_exception=True)
            event_serializer.save()
            return


def populate_all_event_data():
    feed_data = FeedClient().get_event_list()['events']
    active_event_ids = []
    for event_data in feed_data:
        populate_event_from_data(event_data)

        if "id" in event_data:
            active_event_ids.append(event_data["id"])

    # Mark events absent in the feed as inactive
    Event.objects.all().exclude(id__in=active_event_ids)\
        .update(status=EVENT_STATUS.INACTIVE)

    # Rebuild cache
    cache.delete(CacheKey.EVENT_LIST)
