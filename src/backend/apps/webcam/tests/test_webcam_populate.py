import datetime
import json
import zoneinfo
from http.client import INTERNAL_SERVER_ERROR
from pathlib import Path
from unittest.mock import patch

import pytest
from apps.shared.tests import BaseTest, MockResponse
from apps.webcam.models import Webcam
from apps.webcam.tasks import populate_all_webcam_data, populate_webcam_from_data
from apps.webcam.tests.test_data.webcam_parsed_feed import parsed_feed
from django.contrib.gis.geos import Point
from httpx import HTTPStatusError


class TestWebcamModel(BaseTest):
    def setUp(self):
        # Normal feed
        webcam_feed_data = open(
            str(Path(__file__).parent) + "/test_data/webcam_feed_list_of_five.json"
        )
        self.mock_webcam_feed_result = json.load(webcam_feed_data)

        # Feed with error in data
        webcam_feed_data_with_errors = open(
            str(Path(__file__).parent)
            + "/test_data/webcam_feed_list_of_five_with_validation_error.json"
        )
        self.mock_webcam_feed_result_with_errors = json.load(
            webcam_feed_data_with_errors
        )

        # Parsed python dict
        self.parsed_feed = parsed_feed

    def test_populate_webcam_function(self):
        populate_webcam_from_data(self.parsed_feed)

        webcam_one = Webcam.objects.get(id=2)

        # Description
        assert webcam_one.name == "Coquihalla Great Bear Snowshed - N"
        assert webcam_one.caption == "Hwy 5, Great Bear Snowshed looking north."

        # Location
        assert webcam_one.location.equals(Point(-121.159832, 49.596374)) is True
        assert webcam_one.elevation == 980
        assert webcam_one.orientation == "N"
        assert webcam_one.region == 1
        assert webcam_one.region_name == "Vancouver Island"
        assert webcam_one.highway == "5"
        assert webcam_one.highway_group == 0
        assert webcam_one.highway_cam_order == 29
        assert webcam_one.highway_description == "Vancouver Island"

        # General status
        assert webcam_one.is_on is True
        assert webcam_one.should_appear is True
        assert webcam_one.is_new is False
        assert webcam_one.is_on_demand is False

        # Update status
        assert webcam_one.marked_stale is False
        assert webcam_one.marked_delayed is False
        assert webcam_one.last_update_attempt == datetime.datetime(
            2023, 6, 9, 16, 58, 4, tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver")
        )
        assert webcam_one.last_update_modified == datetime.datetime(
            2023, 6, 9, 16, 58, 4, tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver")
        )
        assert webcam_one.update_period_mean == 899
        assert webcam_one.update_period_stddev == 12

    @patch("httpx.get")
    def test_populate_webcam(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse(self.mock_webcam_feed_result, status_code=200),
        ]

        populate_all_webcam_data()
        assert Webcam.objects.count() == 5

        webcam_id_list = sorted(Webcam.objects.all().values_list("id", flat=True))
        assert webcam_id_list == [2, 5, 6, 7, 8]

        # null fields
        webcam_one = Webcam.objects.get(id=8)
        assert webcam_one.last_update_attempt is None
        assert webcam_one.last_update_modified is None

        # blank fields
        webcam_two = Webcam.objects.get(id=7)
        assert webcam_two.highway_description == ""
        assert webcam_two.orientation == ""

        # NULL orientation
        webcam_three = Webcam.objects.get(id=6)
        assert webcam_three.orientation == "NULL"

    @patch("httpx.get")
    def test_populate_webcam_with_validation_error(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse(self.mock_webcam_feed_result_with_errors, status_code=200),
        ]

        # Only cams with validation error(2) are omitted
        populate_all_webcam_data()
        assert Webcam.objects.count() == 4

        webcam_id_list = sorted(Webcam.objects.all().values_list("id", flat=True))
        assert webcam_id_list == [5, 6, 7, 8]

    @patch("httpx.get")
    def test_webcam_feed_client_error(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse({}, status_code=INTERNAL_SERVER_ERROR),
        ]

        with pytest.raises(HTTPStatusError):
            populate_all_webcam_data()

        assert Webcam.objects.count() == 0
