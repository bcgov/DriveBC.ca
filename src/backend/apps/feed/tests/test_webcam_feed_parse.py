import datetime
import json
import os
import zoneinfo

from django.contrib.gis.geos import Point

from apps.feed.serializers import WebcamAPISerializer
from apps.shared.tests import BaseTest


class TestWebcamFeedSerializer(BaseTest):
    def setUp(self):
        data_path = os.path.join(os.getcwd(), "apps/feed/tests/test_data/webcam_feed_list_of_one.json")
        with open(data_path) as f:
            self.webcam_data = json.load(f)

    def test_webcam_to_internal_value(self):
        webcam_serializer = WebcamAPISerializer(data=self.webcam_data)
        webcam_serializer.is_valid(raise_exception=True)

        webcams_list = webcam_serializer.validated_data
        self.assertEqual(len(webcams_list["webcams"]), 1)

        webcam_data = webcams_list["webcams"][0]
        self.assertEqual(webcam_data["id"], 8)

        # Description
        self.assertEqual(webcam_data["name"], 'Malahat Drive - N')
        self.assertEqual(webcam_data["caption"], 'Hwy 1 at South Shawnigan Lake Road, looking north.')

        # Location
        self.assertEqual(webcam_data["region"], 3)
        self.assertEqual(webcam_data["region_name"], 'Vancouver Island')
        self.assertEqual(webcam_data["highway"], '1')
        self.assertEqual(webcam_data["highway_description"], 'Vancouver Island')
        self.assertEqual(webcam_data["highway_group"], 0)
        self.assertEqual(webcam_data["highway_cam_order"], 29)
        self.assertEqual(webcam_data["location"], Point(-123.569743, 48.561231)),
        self.assertEqual(webcam_data["orientation"], 'N')
        self.assertEqual(webcam_data['elevation'], 327)

        # General status
        self.assertEqual(webcam_data["is_on"], True)
        self.assertEqual(webcam_data["should_appear"], True)
        self.assertEqual(webcam_data["is_new"], False)
        self.assertEqual(webcam_data["is_on_demand"], False)

        self.assertEqual(webcam_data["last_update_attempt"], datetime.datetime(2023, 6, 2, 16, 42, 16, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver')))
        self.assertEqual(webcam_data["last_update_modified"], datetime.datetime(2023, 6, 2, 16, 42, 16, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver')))
        self.assertEqual(webcam_data["marked_stale"], False)
        self.assertEqual(webcam_data["marked_delayed"], False)
        self.assertEqual(webcam_data["update_period_mean"], 692)
        self.assertEqual(webcam_data["update_period_stddev"], 65)
