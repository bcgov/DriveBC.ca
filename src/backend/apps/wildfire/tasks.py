from apps.feed.client import FeedClient
from apps.wildfire.models import Wildfire
from apps.wildfire.serializers import WildfireSerializer
from django.core.exceptions import ObjectDoesNotExist


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

    wildfire_serializer = WildfireSerializer(wildfire, data=wildfire_data)
    wildfire_serializer.is_valid(raise_exception=True)
    wildfire_serializer.save()

    return wildfire_id


def populate_all_wildfire_data():
    feed_data = FeedClient().get_wildfire_list()['features']

    active_wildsfires = []
    for wildfire_data in feed_data:
        wildfire_id = populate_wildfire_from_data(wildfire_data)
        active_wildsfires.append(wildfire_id)

    # Delete all wildfires that are not in the active list
    Wildfire.objects.exclude(id__in=active_wildsfires).delete()
