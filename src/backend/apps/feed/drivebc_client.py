import logging
from typing import Dict
from urllib.parse import urljoin

import httpx
from apps.feed.constants import OPEN511, ROUTE_PLANNER, WEBCAMS
from apps.feed.serializers import DrivebcRouteSerializer
from django.conf import settings

logger = logging.getLogger("drivebc_api")


class DrivebcClient:
    """Client for DriveBC API."""

    def __init__(self):
        self.resource_map: Dict[str, dict] = {
            ROUTE_PLANNER: {
                "base_url": settings.DRIVEBC_ROUTE_PLANNER_API_BASE_URL,
                "auth_key": settings.DRIVEBC_ROUTE_PLANNER_API_AUTH_KEY,
            },
            WEBCAMS: {
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
        try:
            base_url = self.resource_map.get(resource_type)["base_url"]  # type: ignore
            return urljoin(base_url, f"{resource_name}")
        except KeyError:
            raise

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

    def get_webcams(self):
        """Used for getting the list of webcams with details."""
        endpoint = self._get_endpoint(resource_type=WEBCAMS, resource_name="webcams")
        return self._process_get_request(
            endpoint, resource_type=ROUTE_PLANNER, params={}
        )

    def get_route_data(self, points="", follow_truck=True):
        endpoint = self._get_endpoint(
            resource_type=ROUTE_PLANNER, resource_name="truck/route.json"
        )
        response_data = self._process_get_request(
            endpoint,
            resource_type=ROUTE_PLANNER,
            params={"points": points, "followTruckRoute": follow_truck},
        )
        serializer = DrivebcRouteSerializer(data=response_data)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data

    def get_events(self, limit=500, bbox="", updated=None):
        """Used for getting the list of events with details."""
        endpoint = self._get_endpoint(resource_type=OPEN511, resource_name="events")
        params = {"limit": limit}
        if bbox:
            params["bbox"] = bbox
        if updated:
            params["updated"] = f">{updated}"
        return self._process_get_request(
            endpoint, resource_type=ROUTE_PLANNER, params=params, timeout=10.0
        )
