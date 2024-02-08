import datetime
import json
import zoneinfo
from http.client import INTERNAL_SERVER_ERROR
from pathlib import Path
from unittest.mock import patch
import pytest
from apps.weather.models import RegionalWeather
from apps.weather.tasks import populate_all_regional_weather_data, populate_regional_weather_from_data
from apps.weather.tests.test_data.regional_weather_parsed_feed import json_feed
from apps.shared.tests import BaseTest, MockResponse


class TestRegionalWeatherModel(BaseTest):
    def setUp(self):
        super().setUp()

        # Normal feed
        regional_weather_feed_data = open(
            str(Path(__file__).parent) +
            "/test_data/regional_weather_feed_list_of_one.json"
        )
        self.mock_regional_weather_feed_result = json.load(regional_weather_feed_data)
        self.json_feed = json_feed

    def test_populate_regional_weather_function(self):
        populate_regional_weather_from_data(self.json_feed)
        regional_weather_one = RegionalWeather.objects.get(code="s0000341")
        assert regional_weather_one.location_latitude == \
               "58.66N"
        

    @patch("httpx.get")
    def test_populate_and_update_regional_weather(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse(self.mock_regional_weather_feed_result, status_code=200),
        ]

        populate_all_regional_weather_data()
        assert RegionalWeather.objects.count() == 98
        regional_weather_id_list = sorted(RegionalWeather.objects.all().order_by("id")
                               .values_list("id", flat=True))
        assert len(regional_weather_id_list) == 98
        regional_weather = RegionalWeather.objects.get(code="s0000341")
        assert regional_weather.location_latitude == "58.66N"

