import datetime
import zoneinfo

from django.contrib.gis.geos import Point

from apps.shared.tests import BaseTest
from apps.webcam.models import Webcam
from apps.webcam.serializers import WebcamSerializer


class TestWebcamSerializer(BaseTest):
    def setUp(self):
        self.webcam = Webcam.objects.create(
            id=121,

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
            update_period_mean=56,
            update_period_stddev=150,
        )

        self.serializer = WebcamSerializer(self.webcam)

    def test_serializer(self):
        self.assertEqual(len(self.serializer.data), 23)
