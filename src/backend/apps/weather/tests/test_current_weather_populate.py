import copy
import logging

from apps.shared.tests import BaseTest
from apps.weather.models import CurrentWeather
from apps.weather.tasks import populate_local_weather_from_data
from apps.weather.tests.test_data.local_weather_parsed_feed import (
    parsed_feed,
    parsed_summer_feed,
)
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

# suppress logged error messages to reduce noise
logging.getLogger().setLevel(logging.CRITICAL)


class TestCurrentWeatherPopulate(BaseTest):
    def setUp(self):
        self.client = APIClient()
        populate_local_weather_from_data(parsed_feed)

    def test_populate_current_weather_function(self):
        local_weather_winter = CurrentWeather.objects.get(weather_station_name='Brandywine Devar')
        assert local_weather_winter.location_longitude == '-123.11806'
        assert len(local_weather_winter.hourly_forecast_group) != 0

        # Update existing record
        updated_parsed_feed = copy.copy(parsed_feed)
        updated_parsed_feed['location_longitude'] = '-123.11807'
        populate_local_weather_from_data(updated_parsed_feed)
        local_weather_winter = CurrentWeather.objects.filter(weather_station_name='Brandywine Devar')
        assert local_weather_winter.count() == 1
        assert local_weather_winter.first().location_longitude == '-123.11807'

        populate_local_weather_from_data(parsed_summer_feed)
        local_weather_summer = CurrentWeather.objects.get(weather_station_name='Brandywine Devar Summer')
        assert len(local_weather_summer.hourly_forecast_group) == 0

    def test_current_weather_viewset(self):
        populate_local_weather_from_data(parsed_summer_feed)

        url = reverse('current')
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        local_weather_winter_serialized = response.data[0]
        assert local_weather_winter_serialized['location_description'] == 'W side of Hwy99, 11 km S of Whistler Creek'
        assert len(local_weather_winter_serialized['hourly_forecast_group']) > 0

        local_weather_summer_serialized = response.data[1]
        assert len(local_weather_summer_serialized['hourly_forecast_group']) == 0
