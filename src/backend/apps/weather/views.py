from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from apps.weather.models import (
    CurrentWeather, HighElevationForecast, RegionalWeather
)
from apps.weather.serializers import (
    CurrentWeatherSerializer,
    HighElevationForecastSerializer,
    RegionalWeatherSerializer
)
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response


class RegionalWeatherAPI(CachedListModelMixin):
    queryset = RegionalWeather.objects.all()
    serializer_class = RegionalWeatherSerializer
    cache_key = CacheKey.REGIONAL_WEATHER_LIST
    cache_timeout = CacheTimeout.REGIONAL_WEATHER_LIST


class WeatherViewSet(viewsets.ViewSet):
    @action(detail=True, methods=['get'])
    def regional(self, request, pk=None):
        regional_weather_objects = RegionalWeather.objects.all()
        serializer = RegionalWeatherSerializer(regional_weather_objects, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def current(self, request, pk=None):
        current_weather_objects = CurrentWeather.objects.all()
        serializer = CurrentWeatherSerializer(current_weather_objects, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def hef(self, request, pk=None):
        forecasts = HighElevationForecast.objects.all()
        serializer = HighElevationForecastSerializer(forecasts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
