import logging

from apps.event.enums import EVENT_STATUS
from apps.event.models import Event
from apps.event.serializers import EventSerializer
from apps.feed.client import FeedClient
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)


def populate_event_from_data(event_data):
    event_id = event_data.get('id')

    try:
        event = Event.objects.get(id=event_id)

    except ObjectDoesNotExist:
        event = Event(id=event_id)

    event_serializer = EventSerializer(event, data=event_data)
    event_serializer.is_valid(raise_exception=True)
    event_serializer.save()


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
