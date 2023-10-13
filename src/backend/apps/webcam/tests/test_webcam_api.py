import datetime
import zoneinfo

from apps.shared import enums as shared_enums
from apps.shared.enums import CacheKey
from apps.shared.tests import BaseTest
from apps.webcam.models import Webcam
from apps.webcam.views import WebcamAPI
from django.contrib.gis.geos import Point
from django.core.cache import cache
from rest_framework.test import APITestCase


class TestWebcamAPI(APITestCase, BaseTest):
    def setUp(self):
        super().setUp()

        for i in range(10):
            Webcam.objects.create(
                id=i,

                # Description
                name="TestWebCam" + str(i),
                caption="Webcam unit test",

                # Location
                region=shared_enums.Region.NORTHERN,
                region_name='Greater Van',
                highway='1C',
                highway_description='Some Highway',
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

    def test_webcam_list_caching(self):
        # Empty cache
        assert cache.get(CacheKey.WEBCAM_LIST) is None

        # Cache miss
        url = "/api/webcams/"
        response = self.client.get(url, {})
        assert len(response.data) == 10
        assert cache.get(CacheKey.WEBCAM_LIST) is not None

        # Cached result
        Webcam.objects.filter(id__gte=5).delete()
        response = self.client.get(url, {})
        assert len(response.data) == 10

        # Updated cached result
        WebcamAPI().set_list_data()
        response = self.client.get(url, {})
        assert len(response.data) == 5

    def test_webcam_list_filtering(self):
        # No filtering
        url = "/api/webcams/"
        response = self.client.get(url, {})
        assert len(response.data) == 10

        # Manually update location of camera
        cam = Webcam.objects.get(id=1)
        cam.location = Point(-120.569743, 38.561231)
        cam.save()

        # Filtered events - hit
        response = self.client.get(url, {'route': '-120.569743,38.561231,-120.569743,39.561231'})
        assert len(response.data) == 1

        # Filtered events - miss
        response = self.client.get(url, {'route': '-110.569743,38.561231,-110.569743,39.561231'})
        assert len(response.data) == 0
