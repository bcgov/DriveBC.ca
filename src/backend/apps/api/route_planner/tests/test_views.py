import json
import os
from unittest import mock

from apps.drivebc_api.serializers import DrivebcRouteSerializer
from apps.route_planner.tests.factories import RouteFactory
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase


def mock_api_response(*args, **kwargs):
    file_path = os.path.join(
        os.getcwd(), "apps/drivebc_api/tests/test_data/drivebc_route.json"
    )
    with open(file_path) as f:
        api_data = json.load(f)
        serializer = DrivebcRouteSerializer(data=api_data)
        serializer.is_valid()
        return serializer.validated_data


class TestRouteViewSetAccess(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.client = APIClient()
        cls.route_1 = RouteFactory.create(name="Primary Route")
        cls.route_2 = RouteFactory.create(name="Secondary Route")

    def test_list_view(self):
        url = reverse("route-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_detail_view(self):
        url = reverse("route-detail", kwargs={"pk": self.route_1.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.route_1.pk)

    def test_delete_view(self):
        url = reverse(
            "route-detail",
            kwargs={"pk": self.route_1.pk},
        )
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_create_view(self):
        url = reverse("route-list")
        request_data = {
            "email": "new@oxd.com",
            "name": "New route",
            "start_location": {"lng": -123.707942, "lat": 48.77869},
            "destination": {"lng": -123.53785, "lat": 48.38201},
        }
        with mock.patch(
            "apps.drivebc_api.drivebc_client.DrivebcClient.get_route_data",
            mock_api_response,
        ):
            response = self.client.post(url, data=request_data, format="json")
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
