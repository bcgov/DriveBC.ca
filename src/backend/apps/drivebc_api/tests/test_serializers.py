import json
import os

from apps.drivebc_api.serializers import DrivebcRouteSerializer
from django.test import TestCase


class TestDrivebcRouteSerializer(TestCase):
    def setUp(self):
        self.file_path = os.path.join(
            os.getcwd(), "apps/drivebc_api/tests/test_data/drivebc_route.json"
        )
        with open(self.file_path) as f:
            self.route_data = json.load(f)

    def test_route_to_internal_value(self):
        route_serializer = DrivebcRouteSerializer(data=self.route_data)
        route_serializer.is_valid(raise_exception=False)
        route_data = route_serializer.validated_data
        self.assertEqual(route_data["criteria"], "fastest")
        self.assertEqual(route_data["srs_code"], "4326")
        self.assertEqual(route_data["distance"], 61.219)
        self.assertTrue(route_data["is_route_found"])
        self.assertEqual(len(route_data["points"]), 2)
        self.assertEqual(len(route_data["route_points"]), 648)
