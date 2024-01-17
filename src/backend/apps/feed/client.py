import logging
from typing import Dict
from urllib.parse import urljoin

import httpx
from apps.feed.constants import DIT, INLAND_FERRY, OPEN511, WEBCAM, WEATHER
from apps.feed.serializers import (
    CarsClosureEventSerializer,
    EventAPISerializer,
    EventFeedSerializer,
    FerryAPISerializer,
    WebcamAPISerializer,
    WebcamFeedSerializer,
)
from django.conf import settings
from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)


class FeedClient:
    """Feed client for external DriveBC APIs."""

    def __init__(self):
        self.resource_map: Dict[str, dict] = {
            WEBCAM: {
                "base_url": settings.DRIVEBC_WEBCAM_API_BASE_URL,
            },
            OPEN511: {
                "base_url": settings.DRIVEBC_OPEN_511_API_BASE_URL,
            },
            DIT: {
                "base_url": settings.DRIVEBC_DIT_API_BASE_URL,
            },
            INLAND_FERRY: {
                "base_url": settings.DRIVEBC_INLAND_FERRY_API_BASE_URL,
            },
            WEATHER: {
                "base_url": settings.DRIVEBC_WEATHER_API_BASE_URL,
            },
        }

    def _get_auth_headers(self, resource_type):
        auth_key = self.resource_map.get(resource_type, {}).get("auth_key")
        if auth_key:
            return {"apiKey": auth_key}
        return {}

    def _get_endpoint(self, resource_type, resource_name):
        base_url = self.resource_map.get(resource_type)["base_url"]  # type: ignore
        return urljoin(base_url, f"{resource_name}")

    @staticmethod
    def _get_response_data_or_raise(response):
        """Checks and returns the response if it has usable content.
        All responses with status 401 and up will be raised as an HTTP error.
        """
        if response and response.status_code <= httpx.codes.BAD_REQUEST:
            return response.json()
        elif response.status_code >= httpx.codes.UNAUTHORIZED:
            logger.error(f"An error occurred with status: {response.status_code}")
            response.raise_for_status()

    def _process_get_request(self, endpoint, params, resource_type, timeout=5.0):
        logger.info(f"Requesting GET {endpoint} with params {params}")
        response = httpx.get(
            endpoint,
            headers=self._get_auth_headers(resource_type),
            params=params if params else {},
            timeout=timeout,
            verify=False,
        )
        return self._get_response_data_or_raise(response)

    def get_single_feed(self, dbo, resource_type, resource_name, serializer_cls):
        """Get data feed for a single object."""
        endpoint = self._get_endpoint(
            resource_type=resource_type, resource_name=resource_name + str(dbo.id)
        )
        response_data = self._process_get_request(
            endpoint, resource_type=resource_type, params={}
        )

        serializer = serializer_cls(data=response_data)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data

    def get_list_feed(self, resource_type, resource_name, serializer_cls, params=None):
        """Get data feed for list of objects."""
        if params is None:
            params = {}
        endpoint = self._get_endpoint(resource_type, resource_name)
        response_data = self._process_get_request(endpoint, params, resource_type)
        serializer = serializer_cls(data=response_data, many=isinstance(response_data, list))

        try:
            serializer.is_valid(raise_exception=True)
            return serializer.validated_data

        except (KeyError, ValidationError):
            res = []
            for index, data in enumerate(serializer.data[resource_name]):
                if serializer.errors[resource_name][index]:
                    logger.warning(
                        f"Error parsing {resource_name} data" +
                        f" for ID {data['id']}" if 'id' in data else ""
                    )

                    logger.warning(serializer.errors[resource_name][index])

                else:
                    res.append(data)

            new_serializer = serializer_cls(data={resource_name: res})
            new_serializer.is_valid(raise_exception=True)
            return new_serializer.validated_data

    # Webcam
    def get_webcam(self, webcam):
        return self.get_single_feed(webcam, WEBCAM, 'webcams/', WebcamFeedSerializer)

    def get_webcam_list(self):
        return self.get_list_feed(WEBCAM, 'webcams', WebcamAPISerializer)

    # Events
    def get_event(self, event):
        return self.get_single_feed(event, OPEN511, 'events/', EventFeedSerializer)

    def get_event_list(self):
        return self.get_list_feed(
            OPEN511, 'events', EventAPISerializer,
            {"format": "json", "limit": 500}
        )

    def get_closures_dict(self):
        """ Return a dict of <id>:True for fast lookup of closed events by <id>. """

        events = self.get_list_feed(
            DIT, 'dbcevents', CarsClosureEventSerializer,
            {"format": "json", "limit": 500}
        )

        return {event["id"]:True for event in events if event["closed"]}

    # Ferries
    def get_ferries_list(self):
        return self.get_list_feed(
            INLAND_FERRY,
            'geoV05/hwy/ows',
            FerryAPISerializer,
            {
                "service": "WFS",
                "version": "1.0.0",
                "request": "GetFeature",
                "typeName": "hwy:ISS_INLAND_FERRY",
                "maxFeatures": 500,
                "outputFormat": "application/json",
                "srsName": "EPSG:4326"
            }
        )
