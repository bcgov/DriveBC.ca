import json
from pathlib import Path
from unittest.mock import patch

from apps.shared.models import RouteGeometry
from apps.shared.tests import BaseTest, MockResponse
from apps.webcam.models import Webcam
from apps.webcam.tasks import (
    add_order_to_cameras,
    build_route_geometries,
    populate_all_webcam_data,
)


class TestWebcamOrdering(BaseTest):
    def setUp(self):
        super().setUp()

        webcam_feed_data = open(
            str(Path(__file__).parent) + "/test_data/webcam_feed_list_of_five.json"
        )
        self.mock_webcam_feed_result = json.load(webcam_feed_data)

        route_data = open(
            str(Path(__file__).parent) + "/test_data/router_api.json"
        )
        self.mock_route_result = json.load(route_data)

        route_data_updated = open(
            str(Path(__file__).parent) + "/test_data/router_api_updated.json"
        )
        self.mock_route_result_updated = json.load(route_data_updated)

    def tearDown(self):
        super().tearDown()

    @patch("httpx.get")
    def test_build_route_geometries(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse(self.mock_route_result, status_code=200),
            MockResponse(self.mock_route_result_updated, status_code=200),
            MockResponse(self.mock_webcam_feed_result, status_code=200),
        ]

        # Geometry doesn't exist, create
        build_route_geometries({
            '1': [
                [
                    -123.95486066140005, 49.193124100635984,
                    -121.32536061875935, 50.80836540291651,
                ]
            ]
        })

        routeGeom = RouteGeometry.objects.filter(id=1).first()
        assert routeGeom is not None
        assert routeGeom.routes.coords[0][0][0] == -123.95489
        assert routeGeom.routes.coords[0][0][1] == 49.19315

        # Geometry exists, update
        build_route_geometries({
            '1': [
                [
                    -123.36924409678147, 48.408850035802615,
                    -123.95486066140005, 49.193124100635984,
                    -121.32536061875935, 50.80836540291651,
                    -116.28419702715699, 51.45337543255555
                ]
            ]
        })

        assert RouteGeometry.objects.all().count() == 1
        routeGeom.refresh_from_db()
        assert routeGeom.routes.coords[0][0][0] == -123.36924
        assert routeGeom.routes.coords[0][0][1] == 48.40885

        # Populate webcams to test ordering
        populate_all_webcam_data()
        add_order_to_cameras()
        hw1_cam_qs = Webcam.objects.filter(highway='1').order_by('route_order')
        assert hw1_cam_qs.first().id == 8
        assert hw1_cam_qs.first().route_order == 0
        assert hw1_cam_qs.last().id == 7
        assert hw1_cam_qs.last().route_order == 1
