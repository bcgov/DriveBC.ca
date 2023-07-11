import datetime
import zoneinfo

from apps.shared import enums as shared_enums
from apps.shared.tests import BaseTest
from apps.webcam.models import Webcam
from django.contrib.gis.geos import Point
from rest_framework import status
from rest_framework.test import APITestCase


class TestWebcamAPI(APITestCase, BaseTest):
    def setUp(self):
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

    def test_webcam_list_pagination(self):
        url = "/api/webcams/"
        response = self.client.get(url, {})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 10

        package_with_no_offset = {
            "limit": 2,
            "offset": 0
        }
        no_offset_response = self.client.get(url, package_with_no_offset)
        assert no_offset_response.status_code == status.HTTP_200_OK
        assert len(no_offset_response.data["results"]) == 2

        package_with_offset = {
            "limit": 3,
            "offset": 2
        }
        offset_response = self.client.get(url, package_with_offset)
        assert offset_response.status_code == status.HTTP_200_OK
        assert len(offset_response.data["results"]) == 3
        assert offset_response.data["results"][0]["id"] == 2
        assert offset_response.data["results"][1]["id"] == 3
        assert offset_response.data["results"][2]["id"] == 4
