import logging

from apps.feed.client import FeedClient
from apps.wildfire.models import Wildfire
from apps.wildfire.serializers import WildfireInternalSerializer
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)


def populate_wildfire_from_data(wildfire_data):
    wildfire_id = wildfire_data.get('id')
    wildfire_status = wildfire_data.get('status')
    if not wildfire_status or wildfire_status == 'Out':
        return

    try:
        wildfire = Wildfire.objects.get(id=wildfire_id)

    except ObjectDoesNotExist:
        # New ferry obj
        wildfire = Wildfire(id=wildfire_id)

    wildfire_serializer = WildfireInternalSerializer(wildfire, data=wildfire_data)
    wildfire_serializer.is_valid(raise_exception=True)
    wildfire_serializer.save()

    return wildfire_id


def populate_all_wildfire_data():
    # Fetch wildfire area data
    wildfire_areas_list = FeedClient().get_wildfire_area_list()['features']
    wildfire_areas_dict = {}
    for wildfire_area in wildfire_areas_list:
        wildfire_areas_dict[wildfire_area['id']] = wildfire_area

    logger.warning("wildfire area count: %s", len(wildfire_areas_list))
    if len(wildfire_areas_list) == 0:
        return

    # Combine area data with point data
    wildfire_data = []
    wildfire_points_list = FeedClient().get_wildfire_location_list()['features']
    for wildfire_point in wildfire_points_list:
        if wildfire_point['id'] in wildfire_areas_dict:
            wildfire_area = wildfire_areas_dict[wildfire_point['id']]
            wildfire_data.append({
                'location': wildfire_point['geometry'],
                **wildfire_point,
                **wildfire_area
            })

    logger.warning("wildfire data count: %s", len(wildfire_data))
    if len(wildfire_data) == 0:
        return

    # Populate wildfires from the combined data
    active_wildfires = []
    for wildfire_data in wildfire_data:
        wildfire_id = populate_wildfire_from_data(wildfire_data)
        if wildfire_id:
            active_wildfires.append(wildfire_id)

    # Delete all wildfires that are not in the active list
    logger.warning("active wildfire count: %s", len(active_wildfires))
    if len(active_wildfires) > 0:  # 2025/09/09 hotfix to prevent deletion of all wildfires
        Wildfire.objects.exclude(id__in=active_wildfires).delete()
