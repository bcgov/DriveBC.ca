import datetime
import zoneinfo

from apps.shared import enums as shared_enums
from apps.shared.tests import BaseTest
from apps.webcam.models import Webcam
from apps.webcam.serializers import WebcamSerializer
from django.contrib.gis.geos import Point


class TestWebcamSerializer(BaseTest):
    def setUp(self):
        super().setUp()

        self.webcam = Webcam.objects.create(
            id=121,

            # Description
            name="TestWebCam",
            caption="Webcam unit test",

            # Location
            region=shared_enums.Region.NORTHERN,
            region_name="Greater Van",
            highway="1C",
            highway_description="Some Highway",
            highway_group=3,
            highway_cam_order=23,
            location=Point(-123.569743, 48.561231),
            orientation=shared_enums.Orientation.NORTH,
            elevation=123,

            # General status
            is_on=True,
            should_appear=False,
            is_new=False,
            is_on_demand=False,

            # Update status
            marked_stale=False,
            marked_delayed=False,
            last_update_attempt=datetime.datetime(
                2023, 6, 2, 16, 42, 16,
                tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver")
            ),
            last_update_modified=datetime.datetime(
                2023, 6, 2, 16, 42, 16,
                tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver")
            ),
            update_period_mean=56,
            update_period_stddev=150,
        )

        self.serializer = WebcamSerializer(self.webcam)

    # 2025/08/29 added 3 weather statino fields
    def test_serializer_data(self):
        assert len(self.serializer.data) == 33
