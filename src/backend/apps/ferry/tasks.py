import logging

from apps.feed.client import FeedClient
from apps.ferry.models import Ferry
from apps.ferry.serializers import FerrySerializer
from apps.shared.enums import CacheKey
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)


def populate_ferry_from_data(ferry_data):
    vessel_id = ferry_data.get('id')

    try:
        ferry = Ferry.objects.get(id=vessel_id)

    except ObjectDoesNotExist:
        # New ferry obj
        ferry = Ferry(id=vessel_id)

    ferry_serializer = FerrySerializer(ferry, data=ferry_data)
    ferry_serializer.is_valid(raise_exception=True)
    ferry_serializer.save()


def populate_all_ferry_data():
    feed_data = FeedClient().get_ferries_list()['features']

    active_vessel_ids = []
    for ferry_data in feed_data:
        populate_ferry_from_data(ferry_data)

        vessel_id = ferry_data.get('id')
        active_vessel_ids.append(vessel_id)

    # Purge ferries absent in the feed
    Ferry.objects.all().exclude(id__in=active_vessel_ids).delete()

    # Reset
    cache.delete(CacheKey.FERRY_LIST)
