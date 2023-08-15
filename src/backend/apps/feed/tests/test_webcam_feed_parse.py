import datetime
import json
import os
import zoneinfo

from apps.feed.serializers import WebcamAPISerializer
from apps.shared.tests import BaseTest
from django.contrib.gis.geos import Point


class TestWebcamFeedSerializer(BaseTest):
    def setUp(self):
        super().setUp()

        data_path = os.path.join(
            os.getcwd(),
            "apps/feed/tests/test_data/webcam_feed_list_of_one.json"
        )
        with open(data_path) as f:
            self.webcam_data = json.load(f)

    def test_webcam_to_internal_value(self):
        webcam_serializer = WebcamAPISerializer(data=self.webcam_data)
        webcam_serializer.is_valid(raise_exception=True)

        webcams_list = webcam_serializer.validated_data
        assert len(webcams_list["webcams"]) == 1

        webcam_data = webcams_list["webcams"][0]
        assert webcam_data["id"] == 8

        # Description
        assert webcam_data["name"] == 'Malahat Drive - N'
        assert webcam_data["caption"] == \
               'Hwy 1 at South Shawnigan Lake Road, looking north.'

        # Location
        assert webcam_data["region"] == 3
        assert webcam_data["region_name"] == 'Vancouver Island'
        assert webcam_data["highway"] == '1'
        assert webcam_data["highway_description"] == 'Vancouver Island'
        assert webcam_data["highway_group"] == 0
        assert webcam_data["highway_cam_order"] == 29
        assert webcam_data["location"] == Point(-123.569743, 48.561231)
        assert webcam_data["orientation"] == 'N'
        assert webcam_data['elevation'] == 327

        # General status
        assert webcam_data["is_on"] is True
        assert webcam_data["should_appear"] is True
        assert webcam_data["is_new"] is False
        assert webcam_data["is_on_demand"] is False

        assert webcam_data["last_update_attempt"] == datetime.datetime(
            2023, 6, 2, 16, 42, 16, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver')
        )
        assert webcam_data["last_update_modified"] == datetime.datetime(
            2023, 6, 2, 16, 42, 16, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver')
        )
        assert webcam_data["marked_stale"] is False
        assert webcam_data["marked_delayed"] is False
        assert webcam_data["update_period_mean"] == 692
        assert webcam_data["update_period_stddev"] == 65
