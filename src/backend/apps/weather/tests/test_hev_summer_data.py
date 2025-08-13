import json
from pathlib import Path
from unittest.mock import patch

from apps.shared.tests import BaseTest, MockResponse
from apps.weather.models import HighElevationForecast
from apps.weather.tasks import populate_all_high_elevation_forecast_data
from django.core.cache import cache


class TestHEVSummerData(BaseTest):
    def setUp(self):
        super().setUp()

        hev_summer_area_list = open(
            str(Path(__file__).parent) +
            "/test_data/hev_summer_area_list.json"
        )
        self.hev_summer_area_list = json.load(hev_summer_area_list)

        hev_summer_data = open(
            str(Path(__file__).parent) +
            "/test_data/hev_summer_data.json"
        )
        self.hev_summer_data = json.load(hev_summer_data)

        cache.clear()
        cache.set('weather_access_token', 'test_token')

    @patch('requests.get')
    def test_populate_and_update_regional_weather(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse(self.hev_summer_area_list, status_code=200),  # hev areas/stations
            MockResponse(self.hev_summer_data, status_code=200),  # hev forecast data
        ]
        populate_all_high_elevation_forecast_data()
        assert HighElevationForecast.objects.all().count() == 1
