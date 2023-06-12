import datetime
import json
import zoneinfo
from pathlib import Path
from unittest.mock import patch

from django.contrib.gis.geos import Point

from apps.shared.tests import BaseTest, MockResponse
from apps.webcam.models import Webcam
from apps.webcam.tasks import populate_all_webcams, populate_webcam_from_data
from apps.webcam.tests.test_data.webcam_serialized_feed import serialized_feed


class TestWebcamModel(BaseTest):
    def setUp(self):
        webcam_feed_data = open(str(Path(__file__).parent) + '/test_data/webcam_feed_five_sets.json')
        self.mock_webcam_feed_result = json.load(webcam_feed_data)

        self.serialized_feed = serialized_feed

    def tearDown(self):
        Webcam.objects.all().delete()

    def test_populate_webcam_from_data(self):
        populate_webcam_from_data(self.serialized_feed)

        webcam = Webcam.objects.filter(id=2).first()

        # Description
        self.assertEqual(webcam.name, 'Coquihalla Great Bear Snowshed - N')
        self.assertEqual(webcam.caption, 'Hwy 5, Great Bear Snowshed looking north.')

        # Location
        self.assertTrue(webcam.location.equals(Point(-121.159832, 49.596374)))
        self.assertEqual(webcam.elevation, 980)
        self.assertEqual(webcam.orientation, 'N')
        self.assertEqual(webcam.region, 1)
        self.assertEqual(webcam.region_name, 'Vancouver Island')
        self.assertEqual(webcam.highway, '5')
        self.assertEqual(webcam.highway_group, 0)
        self.assertEqual(webcam.highway_cam_order, 29)
        self.assertEqual(webcam.highway_description, 'Vancouver Island')

        # General status
        self.assertTrue(webcam.is_on)
        self.assertTrue(webcam.should_appear)
        self.assertFalse(webcam.is_new)
        self.assertFalse(webcam.is_on_demand)

        # Update status
        self.assertFalse(webcam.marked_stale)
        self.assertFalse(webcam.marked_delayed)
        self.assertEqual(webcam.last_update_attempt, datetime.datetime(2023, 6, 9, 16, 58, 4, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver')))
        self.assertEqual(webcam.last_update_modified, datetime.datetime(2023, 6, 9, 16, 58, 4, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver')))
        self.assertEqual(webcam.update_period_mean, 899)
        self.assertEqual(webcam.update_period_stddev, 12)

    @patch("httpx.get")
    def test_populate_webcam(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse(self.mock_webcam_feed_result, status_code=200),
        ]

        populate_all_webcams()
        self.assertEqual(Webcam.objects.count(), 5)

        webcam_id_list = sorted(Webcam.objects.all().values_list('id', flat=True))
        self.assertEqual(webcam_id_list, [2, 5, 6, 7, 8])
