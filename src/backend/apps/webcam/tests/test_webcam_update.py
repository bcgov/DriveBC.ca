import datetime
import json
import zoneinfo
from pathlib import Path
from unittest.mock import patch
from zoneinfo import ZoneInfo

from apps.shared.tests import BaseTest, MockResponse
from apps.webcam.models import Webcam
from apps.webcam.tasks import update_all_webcam_data
from django.contrib.gis.geos import Point
from apps.webcam.tests.test_webcam_ordering import side_effect_populate


class TestWebcamSerializer(BaseTest):
    webcam_feed_data_one = open(
            str(Path(__file__).parent) + "/test_data/webcam_feed_single_one.json"
        )
    mock_webcam_feed_result_one = json.load(webcam_feed_data_one)

    def setUp(self):
        super().setUp()

        self.webcam = Webcam.objects.create(
            id=8,
            # Description
            name="TestWebCam",
            caption="Webcam unit test",
            # Location
            region=6,
            region_name="Greater Van",
            highway="1C",
            highway_description="Some Highway",
            highway_group=3,
            highway_cam_order=23,
            location=Point(-123.569743, 48.561231),
            orientation="E",
            elevation=123,
            # General status
            is_on=True,
            should_appear=True,
            is_new=False,
            is_on_demand=False,
            # Update status
            marked_stale=False,
            marked_delayed=False,
            last_update_attempt=datetime.datetime(
                2023,
                6,
                2,
                16,
                42,
                16,
                tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver"),
            ),
            last_update_modified=datetime.datetime(
                2023,
                6,
                2,
                16,
                42,
                16,
                tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver"),
            ),
            update_period_mean=128,
            update_period_stddev=16,
        )

        webcam_data = open(
            str(Path(__file__).parent) + "/test_data/webcam_feed_single.json"
        )
        self.mock_webcam_feed_result = json.load(webcam_data)

    def test_webcam_should_update(self):
        current_time = datetime.datetime.now(tz=ZoneInfo("America/Vancouver"))
        assert self.webcam.should_update(current_time) is True

        last_updated_time = datetime.datetime(
            2023, 6, 2, 16, 42, 16, tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver")
        )

        # Outside 2 std devs from mean
        assert self.webcam.should_update(last_updated_time) is False
        assert (
            self.webcam.should_update(
                last_updated_time + datetime.timedelta(seconds=95)
            )
            is False
        )

        # Within 2 std devs from mean
        assert (
            self.webcam.should_update(
                last_updated_time + datetime.timedelta(seconds=96)
            )
            is True
        )

        # Always update when there's no stddev
        self.webcam.update_period_stddev = 0
        assert self.webcam.should_update(last_updated_time) is True

        # Always update when there's no mean
        self.webcam.update_period_stddev = 16
        self.webcam.update_period_mean = 0
        assert self.webcam.should_update(last_updated_time) is True

        # Always update when there's no last updated time
        self.webcam.update_period_mean = 128
        self.webcam.last_update_modified = None
        assert self.webcam.should_update(last_updated_time) is True

    @patch("apps.webcam.tasks.populate_all_webcam_data")
    def test_update_existing_webcams(self, mock_populate):
        # Current value
        assert self.webcam.name == "TestWebCam"

        mock_populate.side_effect = lambda *args, **kwargs: side_effect_populate(self.mock_webcam_feed_result_one)
        from apps.webcam import tasks
        tasks.populate_all_webcam_data()

        # # Manually sync webcam to feed data to trigger update logic
        self.webcam.refresh_from_db()
        assert self.webcam.name == "TestWebCam New"  # Camera name updated

        # Manually desync one of the diff fields to trigger update
        self.webcam.last_update_modified = datetime.datetime(
            2026,
            4,
            7,
            14,
            30,
            32,
            tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver"),
        )
        self.webcam.is_on = False
        self.webcam.save()
        update_all_webcam_data()
        self.webcam.refresh_from_db()

        # No extra webcams created
        assert Webcam.objects.all().count() == 1

        # Description
        assert self.webcam.name == "TestWebCam New"
        assert (
            self.webcam.caption == "Hwy 1 at South Shawnigan Lake Road, looking north."
        )

        # Location
        assert self.webcam.location.equals(Point(-123.569743, 48.561231)) is True
        assert self.webcam.elevation == 327
        assert self.webcam.orientation == "N"
        assert self.webcam.region == 3
        assert self.webcam.region_name == "Vancouver Island"
        assert self.webcam.highway == "1"
        assert self.webcam.highway_group == 0
        assert self.webcam.highway_cam_order == 29
        assert self.webcam.highway_description == "Vancouver Island"

        # General status
        assert self.webcam.is_on is False
        assert self.webcam.should_appear is True
        assert self.webcam.is_new is False
        assert self.webcam.is_on_demand is False

        # Update status
        assert self.webcam.marked_stale is False
        assert self.webcam.marked_delayed is False
        assert self.webcam.last_update_modified == datetime.datetime(
            2026, 4, 7, 14, 30, 32, tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver")
        )
        assert self.webcam.update_period_mean == 675
        assert self.webcam.update_period_stddev == 55

        # Manually change webcam id to delete it in the update task
        Webcam.objects.filter(id=self.webcam.id).update(id=923402940)

        # Server error, did not delete
        update_all_webcam_data()
        assert Webcam.objects.all().count() == 1
