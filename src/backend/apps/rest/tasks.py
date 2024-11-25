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

    # Purge rest stops absent in the feed
    available_rest_stop_ids = []
    for rest_stop_data in feed_data:
        try:
            chris_rest_area_id = rest_stop_data.get('properties', {}).get('CHRIS_REST_AREA_ID')
            populate_rest_stop_from_data(rest_stop_data)
            if chris_rest_area_id:
                available_rest_stop_ids.append(chris_rest_area_id)
        except Exception as e:
            logger.warning(e)
    RestStop.objects.exclude(rest_stop_id__in=available_rest_stop_ids)\
        .delete()
    
    # Rebuild cache
    cache.delete(CacheKey.REST_STOP_LIST)
