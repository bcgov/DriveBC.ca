from argparse import _ActionsContainer
from http.client import responses
from apps.weather.models import Weather
from apps.weather.serializers import WeatherSerializer
from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from rest_framework import viewsets
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.response import Response
from rest_framework.decorators import action
from django.conf import settings
import requests



class WeatherAPI(CachedListModelMixin):
    queryset = Weather.objects.all()
    serializer_class = WeatherSerializer
    cache_key = CacheKey.EVENT_LIST
    cache_timeout = CacheTimeout.EVENT_LIST


class WeatherViewSet(viewsets.ViewSet):
    queryset = Weather.objects.all()
    serializer_class = WeatherSerializer

    @action(detail=True, methods=['get'])
    def cityforecast(self, request, pk=None):
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
            # # Save Data to Database
            # weather_data = {
            #     'xml_creation_utc': data.get('XmlCreationUtc'),
            #     'forecast_issued_utc': data.get('ForecastIssuedUtc'),
            # }
            # # Assuming 'pk' is the identifier for the Weather instance
            # weather_instance, created = Weather.objects.update_or_create(defaults=weather_data)
            return Response(data)
            # return weather_data
        except requests.RequestException as e:
            return Response({"error": f"Error fetching data from weather API: {str(e)}"}, status=500)


class WeatherTestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WeatherAPI.queryset
    serializer_class = WeatherAPI.serializer_class