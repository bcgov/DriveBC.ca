import logging
from typing import Dict
from urllib.parse import urljoin

import httpx
from apps.feed.constants import OPEN511, ROUTE_PLANNER, WEBCAM
from apps.feed.serializers import WebcamAPISerializer, WebcamFeedSerializer
from django.conf import settings
from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)


class FeedClient:
    """Feed client for external DriveBC APIs."""

    def __init__(self):
        self.resource_map: Dict[str, dict] = {
            ROUTE_PLANNER: {
                "base_url": settings.DRIVEBC_ROUTE_PLANNER_API_BASE_URL,
                "auth_key": settings.DRIVEBC_ROUTE_PLANNER_API_AUTH_KEY,
            },
            WEBCAM: {
                "base_url": settings.DRIVEBC_WEBCAM_API_BASE_URL,
            },
            OPEN511: {
                "base_url": settings.DRIVEBC_OPEN_511_API_BASE_URL,
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
        print("checking for errors...")
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
            params=params,
            timeout=timeout,
            verify=False,
        )
        return self._get_response_data_or_raise(response)

    def get_webcam(self, webcam):
        """Used for getting a single webcam with details."""
        endpoint = self._get_endpoint(
            resource_type=WEBCAM, resource_name=f"webcams/{webcam.id}"
        )
        response_data = self._process_get_request(
            endpoint, resource_type=WEBCAM, params={}
        )

        serializer = WebcamFeedSerializer(data=response_data)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data

    def get_webcam_list(self):
        """Used for getting the list of webcams with details."""
        endpoint = self._get_endpoint(resource_type=WEBCAM, resource_name="webcams")
        response_data = self._process_get_request(
            endpoint, resource_type=WEBCAM, params={}
        )

        serializer = WebcamAPISerializer(data=response_data)

        try:
            serializer.is_valid(raise_exception=True)
            return serializer.validated_data

        except ValidationError:
            res = []
            for index, data in enumerate(serializer.data["webcams"]):
                if serializer.errors["webcams"][index]:
                    logger.warning(f"Error parsing webcam data for ID {data['id']}")

                else:
                    res.append(data)

            new_serializer = WebcamAPISerializer(data={"webcams": res})
            new_serializer.is_valid(raise_exception=True)
            return new_serializer.validated_data
