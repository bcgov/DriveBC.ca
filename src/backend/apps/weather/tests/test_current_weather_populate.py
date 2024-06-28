import json
from pathlib import Path
from unittest import mock, skip
from unittest.mock import patch

from apps.feed.client import FeedClient
from apps.shared.tests import BaseTest, MockResponse
from apps.weather.models import CurrentWeather
from apps.weather.tasks import (
    populate_current_weather_from_data,
)

class TestCurrentWeatherPopulate(BaseTest):
    def setUp(self):
        super().setUp()

        # Normal feed
        current_weather_feed_data = open(
            str(Path(__file__).parent) +
            "/test_data/current_weather_feed_two.json"
        )
        local_weather_current_one = open(str(Path(__file__).parent) + "/test_data/local_weather_current_one.json")
        self.mock_current_weather_feed_result = json.load(local_weather_current_one)
        # self.json_feed = json_feed

    def test_populate_current_weather_function(self):
        populate_current_weather_from_data(self.mock_current_weather_feed_result)
        current_weather_two = CurrentWeather.objects.get(id=298)
        print(current_weather_two.location_latitude)
        assert current_weather_two.location_latitude == \
               49.16609


