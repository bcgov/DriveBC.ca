import json
from pathlib import Path
from unittest import mock, skip
from unittest.mock import patch

from apps.feed.client import FeedClient
from apps.shared.tests import BaseTest, MockResponse
from apps.weather.models import RegionalWeather
from apps.weather.tasks import (
    populate_all_regional_weather_data,
    populate_regional_weather_from_data,
)
from apps.weather.tests.test_data.regional_weather_parsed_feed import json_feed

class TestRegionalWeatherModel(BaseTest):
    def setUp(self):
        super().setUp()

        # Normal feed
        regional_weather_feed_data = open(
            str(Path(__file__).parent) +
            "/test_data/regional_weather_feed_list_of_two.json"
        )
        self.mock_regional_weather_feed_result = json.load(regional_weather_feed_data)
        self.json_feed = json_feed

        regional_weather_feed_data_weather_one = open(
            str(Path(__file__).parent) +
            "/test_data/regional_weather_feed_weather_one.json"
        )
        self.mock_regional_weather_feed_result_weather_one = json.load(regional_weather_feed_data_weather_one)

    def test_populate_regional_weather_function(self):
        populate_regional_weather_from_data(self.json_feed)
        regional_weather_one = RegionalWeather.objects.get(code="s0000341")
        assert regional_weather_one.location_latitude == \
               "58.66N"

    def test_populate_regional_weather_function_with_existing_data(self):
        RegionalWeather.objects.create(
            code="s0000341",
            location_latitude="58.66N",
            location_longitude="124.64W",
        )
        populate_regional_weather_from_data(self.json_feed)
        regional_weather_one = RegionalWeather.objects.get(code="s0000341")
        assert regional_weather_one.location_latitude == \
               "58.66N"

    @patch('apps.feed.client.FeedClient.get_regional_weather_list')
    def test_populate_and_update_regional_weather(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse(self.mock_regional_weather_feed_result, status_code=200),
        ]
        response = self.mock_regional_weather_feed_result
        client = FeedClient()
        feed_data = client.get_regional_weather_list()
        feed_data = response

        for regional_weather_data in feed_data:
            populate_regional_weather_from_data(regional_weather_data)
        weather_list_length = len(response)
        assert weather_list_length == 2

    def test_populate_all_regional_weather_data(self):
        with mock.patch('requests.post') as mock_post, mock.patch('requests.get') as mock_get:
            # Mock the response for requests.post
            mock_post.return_value.json.return_value = {"access_token": "mocked_access_token"}
            mock_post.return_value.status_code = 200

            # Mock the response for the first requests.get (for area codes)
            mock_get.side_effect = [
                mock.Mock(json=lambda: [{
                    "AreaCode": "s0000846",
                    "AreaName": "Coquihalla Highway - Hope to Merritt",
                    "AreaType": "ECHIGHELEVN"
                    }
                ]),
                # Mock the response for the second requests.get (weather data for a specific area codes)
                mock.Mock(json=lambda: self.mock_regional_weather_feed_result_weather_one),
            ]

            populate_all_regional_weather_data()
            assert len(RegionalWeather.objects.all()) == 1
