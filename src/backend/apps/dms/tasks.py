import logging
from datetime import datetime

from django.contrib.gis.geos import Point
from django.utils import timezone
from apps.dms.models import Dms
from apps.dms.serializers import DmsSerializer
from apps.feed.client import FeedClient
from apps.shared.enums import CacheKey
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)

DMS_TYPES = {'DMS', 'Travel Time'}
DIRECTION_NAMES = {
    'NB': 'Northbound',
    'SB': 'Southbound',
    'EB': 'Eastbound',
    'WB': 'Westbound',
}


def _parse_datetime(value):
    if not value:
        return None

    return datetime.fromisoformat(value.replace('Z', '+00:00'))


def _normalize_dms(sign, status):
    description = sign.get('Description') or ''
    direction = DIRECTION_NAMES.get(description[:2].upper())
    if sign.get('Type') not in DMS_TYPES or direction is None:
        return None

    location = sign.get('Location') or {}
    longitude = location.get('Longitude')
    latitude = location.get('Latitude')
    point = None
    if longitude is not None and latitude is not None:
        point = Point(float(longitude), float(latitude), srid=4326)

    status = status or {}
    return {
        'id': str(sign['Id']),
        'name': sign.get('Name') or '',
        'category': sign.get('Type') or '',
        'description': description,
        'roadway_name': location.get('RoadwayName') or '',
        'roadway_direction': direction,
        'static_text': '',
        'message_text': status.get('Message') or '',
        'status': status.get('Status') or '',
        'location': point,
        'updated_datetime_utc': _parse_datetime(status.get('LastUpdated')),
        'message_expiry_datetime_utc': None,
        'cache_datetime_utc': timezone.now(),
        'is_on': True,
    }


def populate_dms_from_data(dms_data):
    dms_id = dms_data.get('id')
    if not dms_id:
        return

    try:
        dms = Dms.objects.get(id=dms_id)

    except ObjectDoesNotExist:
        dms = Dms(id=dms_id)

    dms_serializer = DmsSerializer(dms, data=dms_data)
    dms_serializer.is_valid(raise_exception=True)
    dms_serializer.save()

    return dms_id


def populate_all_dms_data():
    feed_data = FeedClient().get_dms_list()
    signs = feed_data.get('signs') or []
    statuses = feed_data.get('statuses') or []

    if len(signs) == 0:
        logger.error("DMS data invalid: Signs list is empty")
        return

    statuses_by_id = {str(status['Id']): status for status in statuses if status.get('Id') is not None}

    # Populate dms from the data
    active_dms = []
    for sign in signs:
        if sign.get('Id') is None:
            continue

        dms_data = _normalize_dms(sign, statuses_by_id.get(str(sign['Id'])))
        if dms_data is None:
            continue

        dms_id = populate_dms_from_data(dms_data)
        if dms_id:
            active_dms.append(dms_id)

    # Delete all DMS that are not in the active list
    Dms.objects.exclude(id__in=active_dms).delete()

    # Rebuild cache
    cache.delete(CacheKey.DMS_LIST)
