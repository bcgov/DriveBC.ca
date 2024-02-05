import logging
from typing import Dict
from urllib.parse import urljoin

import httpx
from apps.feed.constants import DIT, INLAND_FERRY, OPEN511, WEBCAM
from apps.feed.constants import DIT, INLAND_FERRY, OPEN511, WEBCAM, REGIONAL_WEATHER, REGIONAL_WEATHER_AREAS
from apps.feed.serializers import (
    CarsClosureEventSerializer,
    EventAPISerializer,
    EventFeedSerializer,
    FerryAPISerializer,
    RegionalWeatherFeedSerializer,
    RegionalWeatherSerializer,
    RegionalWeatherAPISerializer,
    WebcamAPISerializer,
    WebcamFeedSerializer,
)
from django.conf import settings
from rest_framework.exceptions import ValidationError
import requests
from rest_framework.response import Response

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
            REGIONAL_WEATHER: {
                "base_url": settings.DRIVEBC_WEATHER_API_BASE_URL,
            },
            REGIONAL_WEATHER_AREAS: {
                "base_url": settings.DRIVEBC_WEATHER_AREAS_API_BASE_URL,
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

    # Regional Weather
    def get_regional_weather_list_feed(self, resource_type, resource_name, serializer_cls, params=None):
        """Get data feed for list of objects."""
        area_code_endpoint = settings.DRIVEBC_WEATHER_AREAS_API_BASE_URL
        # Obtain Access Token
        token_url = settings.DRIVEBC_WEATHER_API_TOKEN_URL
        client_id = settings.WEATHER_CLIENT_ID
        client_secret = settings.WEATHER_CLIENT_SECRET

        token_params = {
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret,
        }

        try:
            response = requests.post(token_url, data=token_params)
            response.raise_for_status()
            token_data = response.json()
            access_token = token_data.get("access_token")
        except requests.RequestException as e:
            return Response({"error": f"Error obtaining access token: {str(e)}"}, status=500)
        external_api_url = area_code_endpoint
        headers = {"Authorization": f"Bearer {access_token}"}
        try:
            response = requests.get(external_api_url, headers=headers)
            response.raise_for_status()
            data = response.json()
            json_response = data
            json_objects = []
            for entry in json_response:
                area_code = entry["AreaCode"]
                api_endpoint = settings.DRIVEBC_WEATHER_API_BASE_URL + f"/{area_code}"
                # Reget access token in case the previous token expired
                try:
                    response = requests.post(token_url, data=token_params)
                    response.raise_for_status()
                    token_data = response.json()
                    access_token = token_data.get("access_token")
                except requests.RequestException as e:
                    return Response({"error": f"Error obtaining access token: {str(e)}"}, status=500)
                headers = {"Authorization": f"Bearer {access_token}"}

                try:
                    response = requests.get(api_endpoint, headers=headers)
                    data = response.json()
                    location_name_data = data.get("Location", {}).get("Name", {})
                    location_code = location_name_data.get("Code") if location_name_data else None
                    location_latitude = location_name_data.get("Latitude") if location_name_data else None
                    location_longitude = location_name_data.get("Longitude") if location_name_data else None
                    location_name = location_name_data.get("Value") if location_name_data else None

                    observation_data = data.get("CurrentConditions", {}).get("ObservationDateTimeUTC", {})
                    observation_name = observation_data.get("Name") if observation_data else None
                    observation_zone = observation_data.get("Zone") if observation_data else None
                    observation_utc_offset = observation_data.get("UTCOffset") if observation_data else None
                    observation_text_summary = observation_data.get("TextSummary") if observation_data else None

                    condition_data = data.get("CurrentConditions", {})
                    condition = condition_data.get("Condition") if condition_data else None

                    temperature_data = data.get("CurrentConditions", {}).get("Temperature", {})
                    temperature_units = temperature_data.get("Units") if temperature_data else None
                    temperature_value = temperature_data.get("Value") if temperature_data else None

                    visibility_data = data.get("CurrentConditions", {}).get("Visibility", {})
                    visibility_units = visibility_data.get("Units") if visibility_data else None
                    visibility_value = visibility_data.get("Value") if visibility_data else None

                    wind_data = data.get("CurrentConditions", {}).get("Wind", {})
                    wind_speed = wind_data.get("Speed") if wind_data else None
                    wind_gust = wind_data.get("Gust") if wind_data else None
                    wind_direction = wind_data.get("Direction") if wind_data else None

                    wind_speed_units = wind_speed.get("Units") if wind_speed else None
                    wind_speed_value = wind_speed.get("Value") if wind_speed else None

                    wind_gust_units = wind_gust.get("Units") if wind_gust else None
                    wind_gust_value = wind_gust.get("Value") if wind_gust else None

                    conditions = {
                        'condition': condition,
                        'temperature_units': temperature_units,
                        'temperature_value': temperature_value,
                        'visibility_units' : visibility_units,
                        'visibility_value' : visibility_value,
                        'wind_speed_units' : wind_speed_units,
                        'wind_speed_value': wind_speed_value,
                        'wind_gust_units' : wind_gust_units,
                        'wind_gust_value' : wind_gust_value,
                        'wind_direction' : wind_direction,
                    }

                    location_name_data = data.get("Location", {}).get("Name", {})
                    location_code = location_name_data.get("Code") if location_name_data else None
                    location_latitude = location_name_data.get("Latitude") if location_name_data else None
                    location_longitude = location_name_data.get("Longitude") if location_name_data else None
                    location_name = location_name_data.get("Value") if location_name_data else None

                    observation_data = data.get("CurrentConditions", {}).get("ObservationDateTimeUTC", {})
                    observation_name = observation_data.get("Name") if observation_data else None
                    observation_zone = observation_data.get("Zone") if observation_data else None
                    observation_utc_offset = observation_data.get("UTCOffset") if observation_data else None
                    observation_text_summary = observation_data.get("TextSummary") if observation_data else None

                    conditions = conditions

                    forecast_group_data = data.get("ForecastGroup", {})
                    forecast_group = forecast_group_data.get("Forecasts") if forecast_group_data else None

                    hourly_forecast_group_data = data.get("HourlyForecastGroup", {})
                    hourly_forecast_group = hourly_forecast_group_data.get("HourlyForecasts") if hourly_forecast_group_data else None

                    regional_weather_data = {
                        'location_code': location_code,
                        'location_latitude': location_latitude,
                        'location_longitude': location_longitude,
                        'location_name': location_name,
                        'region': data.get("Location", {}).get("Region"),
                        'observation_name': observation_name,
                        'observation_zone': observation_zone,
                        'observation_utc_offset': observation_utc_offset,
                        'observation_text_summary': observation_text_summary,
                        'conditions': conditions,
                        'forecast_group': forecast_group,
                        'hourly_forecast_group': hourly_forecast_group,
                    }

                    serializer = serializer_cls(data=regional_weather_data, many=isinstance(regional_weather_data, list))
                    json_objects.append(regional_weather_data)

                except requests.RequestException as e:
                    print(f"Error making API call for Area Code {area_code}: {e}")

        except requests.RequestException as e:
            return Response({"error": f"Error fetching data from weather API: {str(e)}"}, status=500)

        try:
            serializer.is_valid(raise_exception=True)
            return json_objects

        except (KeyError, ValidationError):
            field_errors = serializer.errors
            for field, errors in field_errors.items():
                print(f"Field: {field}, Errors: {errors}")


    def get_regional_weather_list(self):
        return self.get_regional_weather_list_feed(
            REGIONAL_WEATHER, 'regionalweather', RegionalWeatherSerializer,
            {"format": "json", "limit": 500}
        )