from apps.weather.models import RegionalWeather
from apps.weather.serializers import RegionalWeatherSerializer
from apps.shared.views import CachedListModelMixin
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status
from apps.shared.enums import CacheKey, CacheTimeout

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



