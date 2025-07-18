import datetime
import json
import zoneinfo
from pathlib import Path
from unittest.mock import patch

from apps.shared import enums as shared_enums
from apps.shared.tests import BaseTest, MockResponse
from apps.webcam.models import Webcam
from django.contrib.gis.geos import Point
from rest_framework.test import APITestCase


class TestCameraAPI(APITestCase, BaseTest):
    def setUp(self):
        super().setUp()

        self.webcam_feed_result = open(
            str(Path(__file__).parent) +
            "/test_data/webcam_feed_list_of_five.json"
        )
        self.mock_webcam_feed_result = json.load(self.webcam_feed_result)

        self.webcam_feed_result_filtered = open(
            str(Path(__file__).parent) +
            "/test_data/webcam_feed_list_of_one_filtered.json"
        )
        self.mock_webcam_feed_result_filtered = json.load(self.webcam_feed_result_filtered)

        for i in range(11):
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
                should_appear=i != 10,  # last camera should not be in the list
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

    @patch('rest_framework.test.APIClient.get')
    def test_cameras_list_filtering(self, mock_requests_get):
        # No filtering
        url = "/api/webcams/"

        mock_requests_get.side_effect = [
            MockResponse(self.mock_webcam_feed_result, status_code=200),
        ]

        response = self.client.get(url, {})
        assert response.status_code == 200
        webcams_list = response.json().get('webcams', [])
        webcams_list_length = len(webcams_list)
        assert webcams_list_length == 5

        mock_requests_get.side_effect = [
                    MockResponse(self.mock_webcam_feed_result_filtered, status_code=200),
                ]
        # [-123.0803167, 49.2110127] 1306 SE Marine Dr, Vancouver, BC V5X 4K4
        # [-123.0824109, 49.1926452] 2780 Sweden Way, Richmond, BC V6V 2X1
        # Filtered cams - hit - point on knight bridge
        response = self.client.get(
            url, {'route': '-123.0803167,49.2110127,-123.0824109,49.1926452'}
        )
        assert response.status_code == 200
        webcams_list = response.json().get('webcams', [])
        webcams_list_length = len(webcams_list)
        assert webcams_list_length == 1

        mock_requests_get.side_effect = [
                    MockResponse({"webcams": []}, status_code=200),
                ]
        # [-123.0803167, 49.2110127] 1306 SE Marine Dr, Vancouver, BC V5X 4K4
        # [-123.0188764, 49.205069] 3864 Marine Wy, Burnaby, BC V5J 3H4
        # Filtered cams - miss - does not cross knight bridge
        response = self.client.get(
            url, {'route': '-123.0803167,49.2110127,-123.0188764,49.205069'}
        )
        assert response.status_code == 200
        webcams_list = response.json().get('webcams', [])
        webcams_list_length = len(webcams_list)
        assert webcams_list_length == 0
