import logging

import requests
from apps.feed.serializers import RIDEEventSerializer
from config.settings import RIDE_EVENT_API_URL

logger = logging.getLogger(__name__)


def get_ride_event_dict():
    response = requests.get(RIDE_EVENT_API_URL)
    response_data = response.json()
    serializer = RIDEEventSerializer(data=response_data, many=isinstance(response_data, list))

    serializer.is_valid(raise_exception=False)

    if len(serializer.errors):
        logger.warning('error while serializing ride event data')
        return {}

    return {data['id']: data for data in serializer.validated_data}
