import json
from pathlib import Path
from unittest.mock import patch

from apps.shared.tests import BaseTest, MockResponse
from apps.weather.client import get_regional_weather_list
from apps.weather.models import RegionalWeather
from apps.weather.tasks import populate_regional_weather_from_data
from apps.weather.tests.test_data.regional_weather_parsed_feed import json_feed


class TestRegionalWeatherModel(BaseTest):
    def setUp(self):
        super().setUp()

        # Areas
        regional_weather_areas_list_of_one = open(
            str(Path(__file__).parent) +
            "/test_data/regional_weather_areas_list_of_one.json"
        )
        self.mock_regional_weather_areas = json.load(regional_weather_areas_list_of_one)

        # Weather for s0000002
        regional_weather_area_weather = open(
            str(Path(__file__).parent) +
            "/test_data/regional_weather_area_weather_s0000002.json"
        )
        self.mock_regional_weather_area_weather = json.load(regional_weather_area_weather)
        self.json_feed = json_feed

    def test_populate_regional_weather_function(self):
        populate_regional_weather_from_data(self.json_feed)
        regional_weather_one = RegionalWeather.objects.get(code="s0000341")
        assert regional_weather_one.location_latitude == \
               "58.66N"

    def test_populate_regional_weather_function_with_existing_data(self):
        RegionalWeather.objects.create(
            code="s0000341",
            location_latitude="60.66N",
            location_longitude="124.64W",
        )
        populate_regional_weather_from_data(self.json_feed)
        regional_weather_one = RegionalWeather.objects.get(code="s0000341")
        assert regional_weather_one.location_latitude == \
               "58.66N"

    @patch('requests.get')
    def test_populate_and_update_regional_weather(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse(self.mock_regional_weather_areas, status_code=200),
            MockResponse(self.mock_regional_weather_area_weather, status_code=200),
        ]

        feed_data = get_regional_weather_list(token='mock_token')

        for regional_weather_data in feed_data:
            populate_regional_weather_from_data(regional_weather_data)

        assert RegionalWeather.objects.all().count() == 1
