import datetime
import zoneinfo
from unittest import skip

from apps.shared import enums as shared_enums
from apps.shared.enums import CacheKey
from apps.shared.tests import BaseTest
from apps.webcam.models import Webcam
from apps.webcam.views import WebcamAPI
from django.contrib.gis.geos import Point
from django.core.cache import cache
from rest_framework.test import APITestCase


class TestCameraAPI(APITestCase, BaseTest):
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
                # [-123.1071703, 49.2840563] 123 Water St, Vancouver, BC V6B 1A7
                location=Point(-123.1071703, 49.2840563),
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

    def test_cameras_list_caching(self):
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

    @skip('to be mocked')
    def test_cameras_list_filtering(self):
        # No filtering
        url = "/api/webcams/"
        response = self.client.get(url, {})
        assert len(response.data) == 10

        # Manually update location of a camera
        cam = Webcam.objects.get(id=1)
        # [-123.077455, 49.19547] middle of Knight bridge
        cam.location = Point(-123.077455, 49.19547)
        cam.save()

        # [-123.0803167, 49.2110127] 1306 SE Marine Dr, Vancouver, BC V5X 4K4
        # [-123.0824109, 49.1926452] 2780 Sweden Way, Richmond, BC V6V 2X1
        # Filtered cams - hit - point on knight bridge
        response = self.client.get(
            url, {'route': '-123.0803167,49.2110127,-123.0824109,49.1926452'}
        )
        assert len(response.data) == 1

        # [-123.0803167, 49.2110127] 1306 SE Marine Dr, Vancouver, BC V5X 4K4
        # [-123.0188764, 49.205069] 3864 Marine Wy, Burnaby, BC V5J 3H4
        # Filtered cams - miss - does not cross knight bridge
        response = self.client.get(
            url, {'route': '-123.0803167,49.2110127,-123.0188764,49.205069'}
        )
        assert len(response.data) == 0
