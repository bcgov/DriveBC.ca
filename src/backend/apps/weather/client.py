import logging
from datetime import datetime, timezone

import requests
from apps.feed.client import FeedClient
from django.conf import settings
from django.core.cache import cache
from rest_framework.response import Response

logger = logging.getLogger(__name__)


class AccessTokenException(requests.RequestException):
    def __init__(self, message):
        self.message = f"Error obtaining access token: {str(message)}"
        super().__init__(self.message)


class AreaCodeException(requests.RequestException):
    def __init__(self, message, area_code):
        self.message = f"Error making API call for Area Code {area_code}: {message}"
        super().__init__(self.message)


# Regional Weather
def get_area_weather(api_endpoint, area_code, token=None):
    try:
        access_token = token or cache.get('weather_access_token') or FeedClient().get_new_weather_access_token()

        response = requests.get(
            api_endpoint,
            headers={"Authorization": f"Bearer {access_token}"}
        )

        if response.status_code == 204:
            return  # empty response, continue with next entry

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
        if warnings.get("Events"):
            # Filter out any events with Type "ended"
            warnings["Events"] = [event for event in warnings["Events"] if event.get("Type") != "ended"]
            if len(warnings["Events"]) == 0:
                warnings = None
        else:
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

        return regional_weather_data

    except requests.RequestException as e:
        raise AreaCodeException(str(e), area_code)


def get_regional_weather_list(token=None):
    """Get data feed for list of objects."""
    access_token = token or cache.get('weather_access_token') or FeedClient().get_new_weather_access_token()

    try:
        areas_list = requests.get(
            settings.DRIVEBC_WEATHER_AREAS_API_BASE_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        ).json()

        area_weathers = []
        for entry in areas_list:
            area_code = entry.get("AreaCode")
            api_endpoint = settings.DRIVEBC_WEATHER_API_BASE_URL + f"/{area_code}"

            weather = get_area_weather(api_endpoint, area_code, token)
            if weather:
                area_weathers.append(weather)

        return area_weathers

    except (AccessTokenException, AreaCodeException) as e:
        return Response({"error": str(e)}, status=500)

    except requests.RequestException:
        return Response("Error fetching data from weather API", status=500)
