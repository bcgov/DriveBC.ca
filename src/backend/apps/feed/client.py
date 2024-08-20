import logging
from datetime import datetime, timezone
from typing import Dict
from urllib.parse import urljoin

import httpx
import requests
from apps.feed.constants import (
    CURRENT_WEATHER,
    CURRENT_WEATHER_STATIONS,
    DIT,
    FORECAST_WEATHER,
    INLAND_FERRY,
    OPEN511,
    REGIONAL_WEATHER,
    REGIONAL_WEATHER_AREAS,
    REST_STOP,
    WEBCAM,
)
from apps.feed.serializers import (
    CarsEventSerializer,
    CurrentWeatherSerializer,
    EventAPISerializer,
    EventFeedSerializer,
    FerryAPISerializer,
    RegionalWeatherSerializer,
    RestStopSerializer,
    WebcamAPISerializer,
    WebcamFeedSerializer,
)
from django.conf import settings
from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

# Maps the key for our client API's serializer fields to the matching pair of
# the source API's DataSetName and DisplayName fields
#   serializer              DataSetName               DisplayName                value field
SERIALIZER_TO_DATASET_MAPPING = {
    "air_temperature":     ("air_temp",               "Air Temp"),
    "road_temperature":    ("sfc_temp",               "Pavement Temp"),
    "road_surface":        ("sfc_stat_derived_state", "Pavement Status (State)", "MeaningfulValue"),
    "precipitation":       ("pcpn_amt_pst1hr",        "Precip Hourly"),
    "precipitation_stdobs":("pcpn_amt_snc_std_obs",   "Precip New"),
    "snow":                ("snwfl_amt_pst1hr",       "Snowfall (hourly)"),
    "snow_stdobs":         ("snwfl_amt_snc_std_obs",  "Snowfall (new)"),
    "wind_direction":      ("mean_wnd_dir_pst1hr",    "Wind Direction (mean)"),
    "average_wind":        ("mean_wnd_spd_pst1hr",    "Wind Speed (mean)"),
    "maximum_wind":        ("max_wnd_spd_pst1hr",     "Wind Speed (max)")
    }

# Generated list of DataSetName values for filtering excluded dataset entries
#     ['air_temp', 'sfc_temp', ...]
DATASETNAMES = [value[0] for value in SERIALIZER_TO_DATASET_MAPPING.values()]

# Generated mapping of DataSetName to DisplayName
#    { "air_temp": "Air Temp", ... }
DISPLAYNAME_MAPPING = {value[0]: value[1] for value in SERIALIZER_TO_DATASET_MAPPING.values()}

# Generated mapping of DataSetName to Serializer field
#    { "air_temp": "air_temperature", ... }
SERIALIZER_MAPPING = {value[0]: key for key, value in SERIALIZER_TO_DATASET_MAPPING.items()}

# Generated mapping of DataSetName to the name of the value field in the tuple;
# defaults to "Value"
#    { "air_temp": "Value", "road_surface": "MeanginfulValue", ...}
VALUE_FIELD_MAPPING = {value[0]: (value[2] if len(value) > 2 else "Value")
                       for value in SERIALIZER_TO_DATASET_MAPPING.values()}

logger = logging.getLogger(__name__)


class FeedClient:
    """ Feed client for external DriveBC APIs. """

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
            FORECAST_WEATHER: {
                "base_url": settings.DRIVEBC_WEATHER_FORECAST_API_BASE_URL,
            },
            CURRENT_WEATHER: {
                "base_url": settings.DRIVEBC_WEATHER_CURRENT_API_BASE_URL,
            },
            CURRENT_WEATHER_STATIONS: {
                "base_url": settings.DRIVEBC_WEATHER_CURRENT_STATIONS_API_BASE_URL
            },
            REST_STOP: {
                "base_url": settings.DRIVEBC_REST_STOP_API_BASE_URL,
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
        """
        Checks and returns the response if it has usable content.

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
            verify=True,
        )
        return self._get_response_data_or_raise(response)

    # TODO: make client manage token by expiry so that repeated calls to this
    # method either return a currently valid token or fetch a fresh one
    def get_access_token(self):
        """
        Return a bearer token

        The URL and credentials aren't weather specific; they're for the shared
        services API gateway.
        """

        token_url = settings.DRIVEBC_WEATHER_API_TOKEN_URL
        client_id = settings.WEATHER_CLIENT_ID
        client_secret = settings.WEATHER_CLIENT_SECRET

        token_params = {
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret,
        }

        response = requests.post(token_url, data=token_params)
        response.raise_for_status()
        return response.json().get("access_token")

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

    def get_dit_event_dict(self):
        """ Return a dict of <id>:True for fast lookup of closed events by <id>. """

        res = {}
        cars_events = self.get_list_feed(
            DIT, 'dbcevents', CarsEventSerializer,
            {"format": "json", "limit": 500}
        )

        for event in cars_events:
            res[event['id']] = event

        return res

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

        try:
            access_token = self.get_access_token()
            headers = {"Authorization": f"Bearer {access_token}"}
        except requests.RequestException as e:
            return Response({"error": f"Error obtaining access token: {str(e)}"}, status=500)

        external_api_url = area_code_endpoint

        try:
            response = requests.get(external_api_url, headers=headers)
            response.raise_for_status()
            json_response = response.json()
            json_objects = []

            for entry in json_response:
                area_code = entry.get("AreaCode")
                api_endpoint = settings.DRIVEBC_WEATHER_API_BASE_URL + f"/{area_code}"

                # Get fresh token in case earlier token has expired
                try:
                    access_token = self.get_access_token()
                    headers = {"Authorization": f"Bearer {access_token}"}
                except requests.RequestException as e:
                    return Response({"error": f"Error obtaining access token: {str(e)}"}, status=500)

                try:
                    response = requests.get(api_endpoint, headers=headers)
                    if response.status_code == 204:
                        continue  # empty response, continue with next entry
                    data = response.json()

                    location_data = data.get("Location") or {}
                    name_data = location_data.get("Name") or {}
                    condition_data = data.get("CurrentConditions") or {}
                    temperature_data = condition_data.get("Temperature") or {}
                    visibility_data = condition_data.get("Visibility") or {}
                    wind_data = condition_data.get("Wind") or {}
                    wind_speed = wind_data.get("Speed") or {}
                    wind_gust = wind_data.get("Gust") or {}
                    icon = condition_data.get("IconCode") or {}

                    conditions = {
                        'condition': condition_data.get("Condition"),
                        'temperature_units': temperature_data.get("Units"),
                        'temperature_value': temperature_data.get("Value"),
                        'visibility_units': visibility_data.get("Units"),
                        'visibility_value': visibility_data.get("Value"),
                        'wind_speed_units': wind_speed.get("Units"),
                        'wind_speed_value': wind_speed.get("Value"),
                        'wind_gust_units': wind_gust.get("Units"),
                        'wind_gust_value': wind_gust.get("Value"),
                        'wind_direction': wind_data.get("Direction"),
                        'icon_code': icon.get("Code")
                    }

                    code = name_data.get("Code")
                    station_data = condition_data.get('Station') or {}

                    observed_data = condition_data.get("ObservationDateTimeUTC") or {}
                    observed = observed_data.get("TextSummary")
                    if observed is not None:
                        observed = datetime.strptime(observed, '%A %B %d, %Y at %H:%M %Z')
                        observed = observed.replace(tzinfo=timezone.utc)

                    forecast_issued = data.get("ForecastIssuedUtc")
                    if forecast_issued is not None:
                        try:
                            # Env Canada sends this field as ISO time without
                            # offset, needed for python to parse correctly
                            forecast_issued = datetime.fromisoformat(f"{forecast_issued}+00:00")
                        except Exception:  # date parsing error
                            logger.error(f"Issued UTC sent by {code} as {forecast_issued}")

                    riseset_data = data.get("RiseSet") or {}
                    sunrise = riseset_data.get('SunriseUtc')
                    if sunrise is not None:
                        sunrise = datetime.strptime(sunrise, '%A %B %d, %Y at %H:%M %Z')
                        sunrise = sunrise.replace(tzinfo=timezone.utc)
                    sunset = riseset_data.get('SunsetUtc')
                    if sunset is not None:
                        sunset = datetime.strptime(sunset, '%A %B %d, %Y at %H:%M %Z')
                        sunset = sunset.replace(tzinfo=timezone.utc)

                    forecast_data = data.get("ForecastGroup") or {}
                    hourly_data = data.get("HourlyForecastGroup") or {}

                    warnings = data.get("Warnings") or {}
                    if warnings.get("Url") is None:
                        warnings = None

                    regional_weather_data = {
                        'code': code,
                        'station': station_data.get("Code"),
                        'location_latitude': name_data.get("Latitude"),
                        'location_longitude': name_data.get("Longitude"),
                        'name': name_data.get("Value"),
                        'region': location_data.get("Region"),
                        'conditions': conditions,
                        'forecast_group': forecast_data.get("Forecasts"),
                        'hourly_forecast_group': hourly_data.get("HourlyForecasts"),
                        'observed': observed,
                        'forecast_issued': forecast_issued,
                        'sunrise': sunrise,
                        'sunset': sunset,
                        'warnings': warnings,
                    }

                    serializer = serializer_cls(data=regional_weather_data,
                                                many=isinstance(regional_weather_data, list))
                    json_objects.append(regional_weather_data)

                except requests.RequestException as e:
                    logger.error(f"Error making API call for Area Code {area_code}: {e}")

        except requests.RequestException:
            return Response("Error fetching data from weather API", status=500)

        try:
            serializer.is_valid(raise_exception=True)
            return json_objects

        except (KeyError, ValidationError):
            field_errors = serializer.errors
            for field, errors in field_errors.items():
                logger.error(f"Field: {field}, Errors: {errors}")

    def get_regional_weather_list(self):
        return self.get_regional_weather_list_feed(
            REGIONAL_WEATHER, 'regionalweather', RegionalWeatherSerializer,
            {"format": "json", "limit": 500}
        )

    # Current Weather
    def get_current_weather_list_feed(self, resource_type, resource_name, serializer_cls, params=None):
        """Get data feed for list of objects."""
        area_code_endpoint = settings.DRIVEBC_WEATHER_CURRENT_STATIONS_API_BASE_URL

        try:
            access_token = self.get_access_token()
            headers = {"Authorization": f"Bearer {access_token}"}
        except requests.RequestException as e:
            return Response({"error": f"Error obtaining access token: {str(e)}"}, status=500)

        external_api_url = area_code_endpoint
        headers = {"Authorization": f"Bearer {access_token}"}

        try:
            # Delete items where specified fields are null
            serializer_cls.Meta.model.objects.filter(
                Q(datasets__air_temperature__isnull=True) |
                Q(datasets__average_wind__isnull=True) |
                Q(datasets__precipitation__isnull=True) |
                Q(datasets__snow__isnull=True) |
                Q(datasets__road_temperature__isnull=True) |
                Q(datasets__maximum_wind__isnull=True) |
                Q(datasets__road_condition__isnull=True)
            ).delete()

            response = requests.get(external_api_url, headers=headers)
            response.raise_for_status()
            json_response = response.json()
            json_objects = []
            hourly_forecast_group = []

            for station in json_response:
                station_number = station.get("WeatherStationNumber")
                forecast_endpoint = settings.DRIVEBC_WEATHER_FORECAST_API_BASE_URL + f"/{station_number}"
                api_endpoint = settings.DRIVEBC_WEATHER_CURRENT_API_BASE_URL + f"{station_number}"
                # get fresh token to avoid previous token expiring
                try:
                    access_token = self.get_access_token()
                    headers = {"Authorization": f"Bearer {access_token}"}
                except requests.RequestException as e:
                    return Response({"error": f"Error obtaining access token: {str(e)}"}, status=500)

                try:
                    response = requests.get(forecast_endpoint, headers=headers)
                    if response.status_code != 204:
                        hourly_forecast_data = response.json()
                        hourly_forecast_group = hourly_forecast_data.get("HourlyForecasts") or []
                except requests.RequestException as e:
                    logger.error(f"Error making API call for Area Code {station_number}: {e}")

                try:
                    response = requests.get(api_endpoint, headers=headers)
                    data = response.json()
                    datasets = data.get("Datasets") if data else None

                    # DBC22-2125 - use CollectionUtc of first dataset instead of IssuedUtc, to be improved
                    issuedUtc = datasets[0].get("CollectionUtc") if datasets and len(datasets) else None

                    if issuedUtc is not None:
                        try:
                            # SAWSx sends this field as ISO time without
                            # offset, needed for python to parse correctly
                            issuedUtc = datetime.fromisoformat(f"{issuedUtc}+00:00")
                        except Exception:  # date parsing error
                            logger.error(f"Issued UTC sent by {station_number} as {issuedUtc}")

                    elevation = data.get('WeatherStation').get("Elevation")
                    Longitude = data.get('WeatherStation').get("Longitude")
                    Latitude = data.get('WeatherStation').get("Latitude")
                    weather_station_name = data.get('WeatherStation').get("WeatherStationName")
                    location_description = data.get('WeatherStation').get("LocationDescription")
                    # filtering down dataset to just SensorTypeName and DataSetName
                    filtered_dataset = {}

                    if datasets is None:
                        continue

                    # DBC22-2126 - filtering out dataset that weather info is null
                    shouldSkip = True
                    for dataset in datasets:
                        dataset_name = dataset["DataSetName"]
                        if dataset_name not in DATASETNAMES:
                            continue
                        value_field = VALUE_FIELD_MAPPING[dataset_name]
                        if value_field is not None:
                            shouldSkip = False

                    for dataset in datasets:
                        dataset_name = dataset["DataSetName"]
                        if dataset_name not in DATASETNAMES:
                            continue
                        display_name = DISPLAYNAME_MAPPING[dataset_name]
                        serializer_name = SERIALIZER_MAPPING[dataset_name]
                        value_field = VALUE_FIELD_MAPPING[dataset_name]

                        if display_name == dataset["DisplayName"]:
                            filtered_dataset[serializer_name] = {
                                "value": dataset[value_field], "unit": dataset["Unit"],
                            }

                    if shouldSkip is False:
                        current_weather_data = {
                            'weather_station_name': weather_station_name,
                            'elevation': elevation,
                            'location_description': location_description,
                            'datasets': filtered_dataset,
                            'location_longitude': Longitude,
                            'location_latitude': Latitude,
                            'issuedUtc': issuedUtc,
                            'hourly_forecast_group': hourly_forecast_group
                        }
                        serializer = serializer_cls(data=current_weather_data,
                                                    many=isinstance(current_weather_data, list))
                        json_objects.append(current_weather_data)

                except requests.RequestException as e:
                    logger.error(f"Error making API call for Area Code {station_number}: {e}")

            try:
                serializer.is_valid(raise_exception=True)
                return json_objects

            except (KeyError, ValidationError):
                field_errors = serializer.errors
                for field, errors in field_errors.items():
                    logger.error(f"Field: {field}, Errors: {errors}")

            try:
                with transaction.atomic():
                    serializer = serializer_cls(data=json_objects, many=True)
                    if serializer.is_valid(raise_exception=True):
                        serializer.save()
                        return Response({"message": "Data successfully updated"}, status=200)
                    else:
                        return Response(serializer.errors, status=400)
            except (KeyError, ValidationError):
                field_errors = serializer.errors
                for field, errors in field_errors.items():
                    logger.error(f"Field: {field}, Errors: {errors}")
                return Response({"error": "Validation error occurred"}, status=400)

        except requests.RequestException:
            return Response("Error fetching data from weather API", status=500)

    def get_current_weather_list(self):
        return self.get_current_weather_list_feed(
            CURRENT_WEATHER, 'currentweather', CurrentWeatherSerializer,
            {"format": "json", "limit": 500}
        )

    # Rest Stop
    def get_rest_stop_list_feed(self, resource_type, resource_name, serializer_cls, params=None):
        """Get data feed for list of objects."""
        rest_stop_api_url = settings.DRIVEBC_REST_STOP_API_BASE_URL

        try:
            response = requests.get(rest_stop_api_url)
            response.raise_for_status()
            data = response.json()
            json_response = data
            json_objects = []
            for entry in json_response["features"]:
                rest_stop_id = entry['id']
                geometry = entry["geometry"]
                properties = entry["properties"]
                bbox = entry["bbox"]
                rest_stop_data = {
                        'rest_stop_id': rest_stop_id,
                        'geometry': geometry,
                        'properties': properties,
                        'bbox': bbox,
                    }

                serializer = serializer_cls(data=rest_stop_data, many=isinstance(rest_stop_data, list))
                json_objects.append(rest_stop_data)

        except requests.RequestException as e:
            return Response({"error": f"Error fetching data from rest stop API: {str(e)}"}, status=500)

        try:
            serializer.is_valid(raise_exception=True)
            return json_objects

        except (KeyError, ValidationError):
            field_errors = serializer.errors
            for field, errors in field_errors.items():
                print(f"Field: {field}, Errors: {errors}")

    def get_rest_stop_list(self):
        return self.get_rest_stop_list_feed(
            REST_STOP, 'reststop', RestStopSerializer,
            {"format": "json", "limit": 500}
        )
