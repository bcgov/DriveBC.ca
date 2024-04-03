from apps.shared.enums import CacheKey
from apps.shared.tests import BaseTest
from apps.weather.models import RegionalWeather
from apps.weather.views import RegionalWeatherAPI
from django.core.cache import cache
from rest_framework.test import APITestCase


class TestRegionalWeatherAPI(APITestCase, BaseTest):
    def setUp(self):
        super().setUp()

        self.weather = RegionalWeather.objects.create(
            code="s0000341",
            location_latitude="58.66S",
            location_longitude="124.64W",
            forecast_group={}
        )
        self.weather.save()

    def test_regional_weather_list_caching(self):
        # Empty cache
        assert cache.get(CacheKey.REGIONAL_WEATHER_LIST) is None

        # Cache miss
        url = "/api/weather/regional"
        response = self.client.get(url, {})
        assert len(response.data) == 1
        RegionalWeatherAPI().set_list_data()
        assert cache.get(CacheKey.REGIONAL_WEATHER_LIST) is not None

        # Cached result
        RegionalWeather.objects.filter(code='s0000341').delete()
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
        regional_weather = RegionalWeather.objects.get(code='s0000341')
        regional_weather.code = 's0000846'
        regional_weather.save()
        regional_weather = RegionalWeather.objects.get(code='s0000846')
        assert response.status_code == 200
        assert len(response.data) == 1

        response = self.client.get(
            url
        )
        assert len(response.data) == 1

    def test_get_forecasts(self):
        forecasts = self.weather.get_forecasts()
        test_str = self.weather.__str__()
        assert len(forecasts) == 0
        assert test_str == 'Regional Forecast for ' + str(self.weather.code) + ' (' + str(self.weather.station) + ')'
