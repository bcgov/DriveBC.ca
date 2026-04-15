import json
from pathlib import Path
from unittest.mock import patch

from apps.shared.models import RouteGeometry
from apps.shared.tests import BaseTest, MockResponse
from apps.webcam.models import Webcam
from apps.webcam.tasks import (
    add_order_to_cameras,
    build_route_geometries,
    # populate_all_webcam_data,
)
from django.contrib.gis.geos import Point


def side_effect_populate(mock_data=None):
            for cam in mock_data['webcams']:
                Webcam.objects.update_or_create(
                    id=cam['id'],
                    defaults={
                        'region': cam['region'],
                        'region_name': cam['region_name'],
                        'highway': cam['highway'],
                        'name': cam['name'],
                        'caption': cam['caption'],
                        'orientation': cam['orientation'],
                        'elevation': cam['elevation'],
                        'highway_group': cam['highway_group'],
                        'highway_cam_order': cam['highway_cam_order'],
                        'highway_description': cam['highway_description'],
                        'is_on': cam['is_on'],
                        'should_appear': cam['should_appear'],
                        'is_new': cam['is_new'],
                        'is_on_demand': cam['is_on_demand'],
                        'credit': cam['credit'],
                        'marked_stale': cam['marked_stale'],
                        'marked_delayed': cam['marked_delayed'],
                        'location': Point(cam['location_longitude'], cam['location_latitude']),
                        'update_period_mean': cam['update_period_mean'],
                        'update_period_stddev': cam['update_period_stddev'],
                        'last_update_attempt': cam['last_update_attempt'],
                        'last_update_modified': cam['last_update_modified'],
                    }
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

        webcam_feed_data_1 = open(
            str(Path(__file__).parent) + "/test_data/webcam_feed_list_of_two.json"
        )
        self.mock_webcam_feed_result_1 = json.load(webcam_feed_data_1)

    def tearDown(self):
        super().tearDown()

    @patch("apps.webcam.tasks.populate_all_webcam_data")
    @patch("httpx.get")
    def test_build_route_geometries(self, mock_requests_get, mock_populate):
        mock_requests_get.side_effect = [
            MockResponse(self.mock_route_result, status_code=200),
            MockResponse(self.mock_route_result_updated, status_code=200),
        ]

        mock_populate.side_effect = lambda *args, **kwargs: side_effect_populate(self.mock_webcam_feed_result_1)
        from apps.webcam import tasks
        tasks.populate_all_webcam_data()
        

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

        from apps.webcam import tasks
        tasks.populate_all_webcam_data()
        add_order_to_cameras()
        hw1_cam_qs = Webcam.objects.filter(highway='1').order_by('route_order')
        assert hw1_cam_qs.first().id == 1
        assert hw1_cam_qs.first().route_order == 0
        assert hw1_cam_qs.last().id == 2
        assert hw1_cam_qs.last().route_order == 1
