from apps.shared.tests import BaseTest
from apps.weather.models import CurrentWeather
from apps.weather.tasks import populate_local_weather_from_data
from apps.weather.tests.test_data.local_weather_parsed_feed import (
    parsed_feed,
    parsed_summer_feed,
)


class TestCurrentWeatherPopulate(BaseTest):
    def setUp(self):
        super().setUp()

    def test_populate_current_weather_function(self):
        populate_local_weather_from_data(parsed_feed)
        local_weather_winter = CurrentWeather.objects.get(weather_station_name='Brandywine Devar')
        assert local_weather_winter.location_longitude == '-123.11806'
        assert len(local_weather_winter.hourly_forecast_group) != 0

        populate_local_weather_from_data(parsed_summer_feed)
        local_weather_summer = CurrentWeather.objects.get(weather_station_name='Brandywine Devar Summer')
        assert len(local_weather_summer.hourly_forecast_group) == 0
