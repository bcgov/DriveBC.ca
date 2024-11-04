import logging

from apps.feed.client import FeedClient
from apps.rest.models import RestStop
from apps.shared.enums import CacheKey
from django.core.cache import cache

logger = logging.getLogger(__name__)


def populate_rest_stop_from_data(new_rest_stop_data):
    geometry = new_rest_stop_data.get('geometry')
    properties = new_rest_stop_data.get('properties')
    rest_stop_id = properties.get('CHRIS_REST_AREA_ID')

    existing_record = RestStop.objects.filter(rest_stop_id=rest_stop_id).first()
    data = {
        'rest_stop_id': rest_stop_id,
        'geometry': geometry,
        'properties': properties,
        'bbox': new_rest_stop_data.get('bbox'),
    }

    if existing_record:
        existing_record.__dict__.update(data)
        existing_record.save()
    else:
        RestStop.objects.create(**data)


def populate_all_rest_stop_data():
    client = FeedClient()
    feed_data = client.get_rest_stop_list()

    for rest_stop_data in feed_data:
        populate_rest_stop_from_data(rest_stop_data)

    # Rebuild cache
    cache.delete(CacheKey.REST_STOP_LIST)
