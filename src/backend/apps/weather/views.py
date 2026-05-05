from datetime import datetime, timedelta
from django.utils import timezone


from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from apps.weather.models import CurrentWeather, HighElevationForecast, RegionalWeather
from apps.weather.serializers import (
    CurrentWeatherSerializer,
    HighElevationForecastSerializer,
    RegionalWeatherSerializer,
)
from rest_framework import viewsets


class RegionalWeatherAPI(CachedListModelMixin):
    queryset = RegionalWeather.objects.all().exclude(code=None)
    serializer_class = RegionalWeatherSerializer
    cache_key = CacheKey.REGIONAL_WEATHER_LIST
    cache_timeout = CacheTimeout.REGIONAL_WEATHER_LIST

class RegionalWeatherViewSet(RegionalWeatherAPI, viewsets.ReadOnlyModelViewSet):
    pass

class CurrentWeatherAPI(CachedListModelMixin):
    queryset = CurrentWeather.objects.all().exclude(code=None)
    serializer_class = CurrentWeatherSerializer
    cache_key = CacheKey.CURRENT_WEATHER_LIST
    cache_timeout = CacheTimeout.CURRENT_WEATHER_LIST

class CurrentWeatherViewSet(CurrentWeatherAPI, viewsets.ReadOnlyModelViewSet):
    pass

class HighElevationAPI(CachedListModelMixin):
    serializer_class = HighElevationForecastSerializer
    cache_key = CacheKey.HIGH_ELEVATION_LIST
    cache_timeout = CacheTimeout.HIGH_ELEVATION_LIST

    def get_queryset(self):
        now = timezone.now()
        cutoff = now - timedelta(hours=24)

        return HighElevationForecast.objects.filter(
            issued_utc__gte=cutoff
        ).order_by("-issued_utc")

class HighElevationViewSet(HighElevationAPI, viewsets.ReadOnlyModelViewSet):
    pass
