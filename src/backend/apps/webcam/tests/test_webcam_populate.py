import datetime
import json
import zoneinfo
from http.client import INTERNAL_SERVER_ERROR
from pathlib import Path
from unittest.mock import patch

from django.contrib.gis.geos import Point
from httpx import HTTPStatusError

from apps.shared.tests import BaseTest, MockResponse
from apps.webcam.models import Webcam
from apps.webcam.tasks import populate_all_webcams, populate_webcam_from_data
from apps.webcam.tests.test_data.webcam_parsed_feed import parsed_feed


class TestWebcamModel(BaseTest):
    def setUp(self):
        webcam_feed_data = open(str(Path(__file__).parent) + '/test_data/webcam_feed_list_of_five.json')
        self.mock_webcam_feed_result = json.load(webcam_feed_data)

        webcam_feed_data_with_errors = open(str(Path(__file__).parent) + '/test_data/webcam_feed_list_of_five_with_validation_error.json')
        self.mock_webcam_feed_result_with_errors = json.load(webcam_feed_data_with_errors)

        self.parsed_feed = parsed_feed

    def test_populate_webcam_function(self):
        populate_webcam_from_data(self.parsed_feed)

        webcam_one = Webcam.objects.get(id=2)

        # Description
        self.assertEqual(webcam_one.name, 'Coquihalla Great Bear Snowshed - N')
        self.assertEqual(webcam_one.caption, 'Hwy 5, Great Bear Snowshed looking north.')

        # Location
        self.assertTrue(webcam_one.location.equals(Point(-121.159832, 49.596374)))
        self.assertEqual(webcam_one.elevation, 980)
        self.assertEqual(webcam_one.orientation, 'N')
        self.assertEqual(webcam_one.region, 1)
        self.assertEqual(webcam_one.region_name, 'Vancouver Island')
        self.assertEqual(webcam_one.highway, '5')
        self.assertEqual(webcam_one.highway_group, 0)
        self.assertEqual(webcam_one.highway_cam_order, 29)
        self.assertEqual(webcam_one.highway_description, 'Vancouver Island')

        # General status
        self.assertTrue(webcam_one.is_on)
        self.assertTrue(webcam_one.should_appear)
        self.assertFalse(webcam_one.is_new)
        self.assertFalse(webcam_one.is_on_demand)

        # Update status
        self.assertFalse(webcam_one.marked_stale)
        self.assertFalse(webcam_one.marked_delayed)
        self.assertEqual(webcam_one.last_update_attempt, datetime.datetime(2023, 6, 9, 16, 58, 4, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver')))
        self.assertEqual(webcam_one.last_update_modified, datetime.datetime(2023, 6, 9, 16, 58, 4, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver')))
        self.assertEqual(webcam_one.update_period_mean, 899)
        self.assertEqual(webcam_one.update_period_stddev, 12)

    @patch("httpx.get")
    def test_populate_webcam(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse(self.mock_webcam_feed_result, status_code=200),
        ]

        populate_all_webcams()
        self.assertEqual(Webcam.objects.count(), 5)

        webcam_id_list = sorted(Webcam.objects.all().values_list('id', flat=True))
        self.assertEqual(webcam_id_list, [2, 5, 6, 7, 8])

        # null fields
        webcam_one = Webcam.objects.get(id=8)
        self.assertIsNone(webcam_one.last_update_attempt)
        self.assertIsNone(webcam_one.last_update_modified)

        # blank fields
        webcam_two = Webcam.objects.get(id=7)
        self.assertEqual(webcam_two.highway_description, '')
        self.assertEqual(webcam_two.orientation, '')

        # NULL orientation
        webcam_three = Webcam.objects.get(id=6)
        self.assertEqual(webcam_three.orientation, 'NULL')

    @patch("httpx.get")
    def test_populate_webcam_with_validation_error(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse(self.mock_webcam_feed_result_with_errors, status_code=200),
        ]

        # Only cams with validation error are omitted
        populate_all_webcams()
        self.assertEqual(Webcam.objects.count(), 4)

        webcam_id_list = sorted(Webcam.objects.all().values_list('id', flat=True))
        self.assertEqual(webcam_id_list, [5, 6, 7, 8])

    @patch("httpx.get")
    def test_feed_client_error(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse({}, status_code=INTERNAL_SERVER_ERROR),
        ]

        with self.assertRaises(HTTPStatusError):
            populate_all_webcams()

        self.assertEqual(Webcam.objects.count(), 0)
