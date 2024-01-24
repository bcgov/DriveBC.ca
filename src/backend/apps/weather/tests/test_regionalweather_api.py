from apps.weather.models import RegionalWeather
from apps.weather.views import RegionalWeatherAPI
from apps.shared.enums import CacheKey
from apps.shared.tests import BaseTest
from django.core.cache import cache
from rest_framework.test import APITestCase


class TestRegionalWeatherAPI(APITestCase, BaseTest):
    def setUp(self):
        super().setUp()

        RegionalWeather.objects.create(
            location_code = "s0000341",
            location_latitude = "58.66N", 
            location_longitude = "124.64W",
        )

    def test_regional_weather_list_caching(self):
        # Empty cache
        assert cache.get(CacheKey.REGIONAL_WEATHER_LIST) is None

        # Cache miss
        url = "/api/weather/regional"
        response = self.client.get(url, {})
        assert len(response.data) == 1
        # assert cache.get(CacheKey.REGIONAL_WEATHER_LIST) is not None

        # Cached result
        RegionalWeather.objects.filter(location_code='s0000341').delete()
        response = self.client.get(url, {})
        assert len(response.data) == 0

        # Updated cached result
        RegionalWeatherAPI().set_list_data()
        response = self.client.get(url, {})
        assert len(response.data) == 0

    def test_regional_weather_list_filtering(self):
        # No filtering
        url = "/api/weather/regional"
        response = self.client.get(url, {})
        assert response.status_code == 200
        assert len(response.data) == 1

        # Manually update location code
        regional_weather = RegionalWeather.objects.get(location_code='s0000341')
        regional_weather.location_code = 's0000846'
        regional_weather.save()
        regional_weather = RegionalWeather.objects.get(location_code='s0000846')
        assert response.status_code == 200
        assert len(response.data) == 1

        response = self.client.get(
            url
        )
        assert len(response.data) == 1

