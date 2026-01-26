import logging
from apps.feed.client import FeedClient
from apps.dms.models import Dms
from apps.dms.serializers import DmsSerializer
from django.core.exceptions import ObjectDoesNotExist
from apps.shared.enums import CacheKey
from django.core.cache import cache

logger = logging.getLogger(__name__)


def populate_dms_from_data(dms_data):
    dms_id = dms_data.get('id')
    dms_status = dms_data.get('status')
    if not dms_status or dms_status == 'Out':
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
    # Fetch DMS data
    dms_list = FeedClient().get_dms_list()['features']
    dms_dict = {}
    for dms in dms_list:
        dms_dict[dms['id']] = dms

    logger.warning("DMS count: %s", len(dms_list))
    if len(dms_list) == 0:
        return

    # Populate dms from the data
    active_dms = []
    for dms_data in dms_list:
        dms_id = populate_dms_from_data(dms_data)
        if dms_id:
            active_dms.append(dms_id)

    # Delete all DMS that are not in the active list
    logger.warning("active DMS count: %s", len(active_dms))
    if len(active_dms) > 0:
        Dms.objects.exclude(id__in=active_dms).delete()

    # Rebuild cache
    cache.delete(CacheKey.DMS_LIST)