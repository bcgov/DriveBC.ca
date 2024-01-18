import requests
from apps.weather.models import RegionalCurrent, RegionalForecast
from apps.weather.serializers import RegionalCurrentSerializer, RegionalForecastSerializer
from apps.shared.views import CachedListModelMixin
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from django.conf import settings

class RegionalCurrentAPI(CachedListModelMixin):
    queryset = RegionalCurrent.objects.all()
    serializer_class = RegionalCurrentSerializer

class RegionalForecastAPI(CachedListModelMixin):
    queryset = RegionalForecast.objects.all()
    serializer_class = RegionalForecastSerializer

class WeatherViewSet(viewsets.ViewSet):
    @action(detail=True, methods=['get'])
    def regionalcurrent(self, request, pk=None):
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
        external_api_url = settings.DRIVEBC_WEATHER_API_BASE_URL
        headers = {"Authorization": f"Bearer {access_token}"}
        external_api_url_with_id = f"{external_api_url}{pk}"
        try:
            response = requests.get(external_api_url_with_id, headers=headers)
            response.raise_for_status()
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
            visibility_units = visibility_data.get("Units") if temperature_data else None
            visibility_value = visibility_data.get("Value") if temperature_data else None

            wind_data = data.get("CurrentConditions", {}).get("Wind", {})
            wind_speed = wind_data.get("Speed") if wind_data else None
            wind_gust = wind_data.get("Gust") if wind_data else None
            wind_direction = wind_data.get("Direction") if wind_data else None

            wind_speed_units = wind_speed.get("Units") if temperature_data else None
            wind_speed_value = wind_speed.get("Value") if temperature_data else None

            wind_gust_units = wind_gust.get("Units") if temperature_data else None
            wind_gust_value = wind_gust.get("Value") if temperature_data else None

            # Save Data to Database
            regional_current_data = {
                'location_code': location_code,
                'location_latitude': location_latitude,
                'location_longitude': location_longitude,
                'location_name': location_name,
                'region': data.get("Location", {}).get("Region"),
                'observation_name': observation_name,
                'observation_zone': observation_zone,
                'observation_utc_offset': observation_utc_offset,
                'observation_text_summary': observation_text_summary,
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

            regional_current_instance, created = RegionalCurrent.objects.update_or_create(defaults=regional_current_data)
            serializer = RegionalCurrentSerializer(regional_current_instance)
            return Response(serializer.data)
        
        except requests.RequestException as e:
            return Response({"error": f"Error fetching data from weather API: {str(e)}"}, status=500)


    @action(detail=True, methods=['get'])
    def regionalforecast(self, request, pk=None):
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
        external_api_url = settings.DRIVEBC_WEATHER_API_BASE_URL
        headers = {"Authorization": f"Bearer {access_token}"}
        external_api_url_with_id = f"{external_api_url}{pk}"
        try:
            response = requests.get(external_api_url_with_id, headers=headers)
            response.raise_for_status()
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

            forecast_group = data.get("ForecastGroup", {}).get("Forecasts", [])
            hourly_forecast_group = data.get("HourlyForecastGroup", {}).get("HourlyForecasts", [])

            # Save Data to Database
            regional_forecast_data = {
                'location_code': location_code,
                'location_latitude': location_latitude,
                'location_longitude': location_longitude,
                'location_name': location_name,
                'region': data.get("Location", {}).get("Region"),
                'observation_name': observation_name,
                'observation_zone': observation_zone,
                'observation_utc_offset': observation_utc_offset,
                'observation_text_summary': observation_text_summary,
                'forecast_group': forecast_group,
                'hourly_forecast_group': hourly_forecast_group,
            }

            regional_forecast_instance, created = RegionalForecast.objects.update_or_create(defaults=regional_forecast_data)
            serializer = RegionalForecastSerializer(regional_forecast_instance)
            return Response(serializer.data)
            
        except requests.RequestException as e:
            return Response({"error": f"Error fetching data from weather API: {str(e)}"}, status=500)

class RegionalCurrentTestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RegionalCurrentAPI.queryset
    serializer_class = RegionalCurrentAPI.serializer_class

class RegionalForecastTestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RegionalForecastAPI.queryset
    serializer_class = RegionalForecastAPI.serializer_class



