import datetime
import json
from pathlib import Path
from unittest.mock import patch

from apps.feed.client import FeedClient
from apps.feed.serializers import CurrentWeatherSerializer
from apps.shared.tests import BaseTest, MockResponse
from django.conf import settings


class TestCurrentWeatherFeedParser(BaseTest):
    def setUp(self):
        super().setUp()

        data_dir = Path(__file__).parent / "test_data"
        with open(data_dir / "stations_data.json") as f:
            self.stations_data = json.load(f)

        with open(data_dir / "forecast_data.json") as f:
            self.forecast_data = json.load(f)

        with open(data_dir / "general_data.json") as f:
            self.general_data = json.load(f)

    @patch("apps.feed.client.FeedClient.make_weather_request")
    def test_get_current_weather_list_feed(self, mock_make_weather_request):
        def weather_request_side_effect(endpoint, token):
            del token

            if endpoint == settings.DRIVEBC_WEATHER_CURRENT_STATIONS_API_BASE_URL:
                return MockResponse(self.stations_data, status_code=200)

            if endpoint.startswith(settings.DRIVEBC_WEATHER_FORECAST_API_BASE_URL):
                station_number = endpoint.rsplit("/", 1)[-1]
                return MockResponse(self.forecast_data.get(station_number, {}), status_code=200)

            if endpoint.startswith(settings.DRIVEBC_WEATHER_CURRENT_API_BASE_URL):
                station_number = endpoint.replace(settings.DRIVEBC_WEATHER_CURRENT_API_BASE_URL, "")
                return MockResponse(self.general_data.get(station_number, {}), status_code=200)

            return MockResponse({}, status_code=404)

        mock_make_weather_request.side_effect = weather_request_side_effect

        parsed_feed = FeedClient().get_current_weather_list_feed(
            serializer_cls=CurrentWeatherSerializer,
            token="mock-token",
        )

        assert len(parsed_feed) == 1
        weather_data = parsed_feed[0]
        parsed_codes = {entry["code"] for entry in parsed_feed}
        assert parsed_codes == {"11091"}

        # Skip reasons from input fixtures
        assert "11092" not in parsed_codes  # VMS station name
        assert "11093" not in parsed_codes  # Datasets is null
        assert "11094" not in parsed_codes  # CollectionUtc parse error
        assert "11095" not in parsed_codes  # Mapped weather values empty/null

        # General
        assert weather_data["code"] == "11091"
        assert weather_data["weather_station_name"] == "Brandywine Devar"
        assert weather_data["elevation"] == 496
        assert weather_data["location_description"] == "W side of Hwy99, 11 km S of Whistler Creek"
        assert weather_data["location_longitude"] == -123.11806
        assert weather_data["location_latitude"] == 50.05417
        assert weather_data["issuedUtc"] == datetime.datetime(
            2026, 2, 24, 2, 0, tzinfo=datetime.timezone.utc
        )

        # Dataset mapping
        assert weather_data["datasets"]["air_temperature"] == {
            "value": "-0.332",
            "unit": "deg C",
        }
        assert weather_data["datasets"]["precipitation"] == {
            "value": "-0.2",
            "unit": "mm",
        }
        assert weather_data["datasets"]["precipitation_stdobs"] == {
            "value": "5.6",
            "unit": "mm",
        }
        assert weather_data["datasets"]["snow"] == {
            "value": "-0.1",
            "unit": "cm",
        }
        assert weather_data["datasets"]["snow_stdobs"] == {
            "value": "4",
            "unit": "cm",
        }
        assert weather_data["datasets"]["wind_direction"] == {
            "value": "358.7",
            "unit": "deg",
        }
        assert weather_data["datasets"]["maximum_wind"] == {
            "value": "5.574",
            "unit": "km/h",
        }
        assert weather_data["datasets"]["average_wind"] == {
            "value": "1.063",
            "unit": "km/h",
        }

        # Hourly forecast feed passthrough
        assert len(weather_data["hourly_forecast_group"]) == len(
            self.forecast_data["11091"]["HourlyForecasts"]
        )
        assert weather_data["hourly_forecast_group"][0] == {
            "ObservationTypeName": "surfaceCondition",
            "TimestampUtc": "2026-02-23T23:00:00.000Z",
            "Unit": "",
            "Value": "SNOW",
        }
