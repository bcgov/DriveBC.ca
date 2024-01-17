import requests
from apps.weather.models import RegionalCurrent
from apps.weather.serializers import WeatherSerializer
from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from django.conf import settings
from django.forms.models import model_to_dict

class WeatherAPI(CachedListModelMixin):
    queryset = RegionalCurrent.objects.all()
    serializer_class = WeatherSerializer
    cache_key = CacheKey.EVENT_LIST
    cache_timeout = CacheTimeout.EVENT_LIST

class WeatherViewSet(viewsets.ViewSet):
    queryset = RegionalCurrent.objects.all()
    serializer_class = WeatherSerializer

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
            # Save Data to Database
            regional_current_data = {
                'station_code': f"{pk}",
                'station_name': data.get("Location", {}).get("Name", {}).get("Value"),
                'condition': data.get("CurrentConditions", {}).get("Condition"),
                'temperature_units': data.get("CurrentConditions", {}).get("Temperature", {}).get("Units"),
                'temperature_value': data.get("CurrentConditions", {}).get("Temperature", {}).get("Value"),
                'visibility_units' : data.get("CurrentConditions", {}).get("Visibility", {}).get("Units"),
                'visibility_value' : data.get("CurrentConditions", {}).get("Visibility", {}).get("Value"),
                'wind_speed_units' : data.get("CurrentConditions", {}).get("Wind", {}).get("Speed", {}).get("Units"),
                'wind_speed_value': data.get("CurrentConditions", {}).get("Wind", {}).get("Speed", {}).get("Value"),
                'wind_gust_units' : data.get("CurrentConditions", {}).get("Wind", {}).get("Gust", {}).get("Units"),
                'wind_gust_value' : data.get("CurrentConditions", {}).get("Wind", {}).get("Gust", {}).get("Value"),
                'wind_direction' : data.get("CurrentConditions", {}).get("Wind", {}).get("Direction"),
            }

            regional_current_instance, created = RegionalCurrent.objects.update_or_create(defaults=regional_current_data)
            # Convert the model instance to a dictionary
            data_dict = model_to_dict(regional_current_instance)
            return Response(data_dict)
        
        except requests.RequestException as e:
            return Response({"error": f"Error fetching data from weather API: {str(e)}"}, status=500)

class WeatherTestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WeatherAPI.queryset
    serializer_class = WeatherAPI.serializer_class