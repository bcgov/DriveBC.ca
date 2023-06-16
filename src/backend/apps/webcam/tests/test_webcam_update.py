import datetime
import json
import zoneinfo
from pathlib import Path
from unittest.mock import patch

import pytz
from django.contrib.gis.geos import Point

from apps.shared.tests import BaseTest, MockResponse
from apps.webcam.models import Webcam
from apps.webcam.tasks import update_exisitng_webcams


class TestWebcamSerializer(BaseTest):
    def setUp(self):
        self.webcam = Webcam.objects.create(
            id=8,

            # Description
            name='TestWebCam',
            caption='Webcam unit test',

            # Location
            region=6,
            region_name='Greater Van',
            highway='1C',
            highway_description='Some Highway',
            highway_group=3,
            highway_cam_order=23,
            location=Point(-123.569743, 48.561231),
            orientation='E',
            elevation=123,

            # General status
            is_on=True,
            should_appear=False,
            is_new=False,
            is_on_demand=False,

            # Update status
            marked_stale=False,
            marked_delayed=False,
            last_update_attempt=datetime.datetime(2023, 6, 2, 16, 42, 16, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver')),
            last_update_modified=datetime.datetime(2023, 6, 2, 16, 42, 16, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver')),
            update_period_mean=128,
            update_period_stddev=16,
        )

        webcam_data = open(str(Path(__file__).parent) + '/test_data/webcam_feed_single.json')
        self.mock_webcam_feed_result = json.load(webcam_data)

    def test_webcam_should_update(self):
        current_time = datetime.datetime.now(tz=pytz.timezone('America/Vancouver'))
        self.assertTrue(self.webcam.should_update(current_time))

        last_updated_time = datetime.datetime(2023, 6, 2, 16, 42, 16, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver'))

        # Outside 2 std devs from mean
        self.assertFalse(self.webcam.should_update(last_updated_time))
        self.assertFalse(self.webcam.should_update(last_updated_time + datetime.timedelta(seconds=95)))

        # Within 2 std devs from mean
        self.assertTrue(self.webcam.should_update(last_updated_time + datetime.timedelta(seconds=96)))

        # Always update when there's no stddev
        self.webcam.update_period_stddev = 0
        self.assertTrue(self.webcam.should_update(last_updated_time))

        # Always update when there's no mean
        self.webcam.update_period_stddev = 16
        self.webcam.update_period_mean = 0
        self.assertTrue(self.webcam.should_update(last_updated_time))

        # Always update when there's no last updated time
        self.webcam.update_period_mean = 128
        self.webcam.last_update_modified = None
        self.assertTrue(self.webcam.should_update(last_updated_time))

    @patch("httpx.get")
    def test_update_existing_webcams(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse(self.mock_webcam_feed_result, status_code=200),
        ]

        # Current value
        self.assertEqual(self.webcam.name, 'TestWebCam')
        self.assertFalse(self.webcam.should_appear)

        # Webcam not updated due to should_appear = False
        update_exisitng_webcams()
        self.webcam.refresh_from_db()
        self.assertEqual(self.webcam.name, 'TestWebCam')

        # Save and update webcam data
        self.webcam.should_appear = True
        self.webcam.save()
        update_exisitng_webcams()
        self.webcam.refresh_from_db()

        # No extra webcams created
        self.assertEqual(Webcam.objects.all().count(), 1)

        # Description
        self.assertEqual(self.webcam.name, 'Malahat Drive - N')
        self.assertEqual(self.webcam.caption, 'Hwy 1 at South Shawnigan Lake Road, looking north.')

        # Location
        self.assertTrue(self.webcam.location.equals(Point(-123.569743, 48.561231)))
        self.assertEqual(self.webcam.elevation, 327)
        self.assertEqual(self.webcam.orientation, 'N')
        self.assertEqual(self.webcam.region, 3)
        self.assertEqual(self.webcam.region_name, 'Vancouver Island')
        self.assertEqual(self.webcam.highway, '1')
        self.assertEqual(self.webcam.highway_group, 0)
        self.assertEqual(self.webcam.highway_cam_order, 29)
        self.assertEqual(self.webcam.highway_description, 'Vancouver Island')

        # General status
        self.assertTrue(self.webcam.is_on)
        self.assertTrue(self.webcam.should_appear)
        self.assertFalse(self.webcam.is_new)
        self.assertFalse(self.webcam.is_on_demand)

        # Update status
        self.assertFalse(self.webcam.marked_stale)
        self.assertFalse(self.webcam.marked_delayed)
        self.assertEqual(self.webcam.last_update_attempt, datetime.datetime(2023, 6, 14, 14, 30, 32, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver')))
        self.assertEqual(self.webcam.last_update_modified, datetime.datetime(2023, 6, 14, 14, 30, 32, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver')))
        self.assertEqual(self.webcam.update_period_mean, 675)
        self.assertEqual(self.webcam.update_period_stddev, 55)
