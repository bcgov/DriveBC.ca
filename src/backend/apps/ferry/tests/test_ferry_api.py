from apps.ferry.models import Ferry
from apps.ferry.views import FerryAPI
from apps.shared.enums import CacheKey
from apps.shared.tests import BaseTest
from django.contrib.gis.geos import Point
from django.core.cache import cache
from rest_framework.test import APITestCase


class TestFerryAPI(APITestCase, BaseTest):
    def setUp(self):
        super().setUp()

        for i in range(10):
            Ferry.objects.create(
                # General
                id=i,
                name=f"Ferry {i}",
                route_id=i,
                route_name=f"Route {i}",
                route_description=f"Description {i}",

                # Urls
                url=f"http://example.com/route_{i}",
                image_url=f"http://example.com/image_{i}.jpg",

                # Location
                location=Point(-123.1071703, 49.2840563),

                # Capacity
                vehicle_capacity=100 + i,
                passenger_capacity=200 + i,
                crossing_time_min=30 + i,
                weight_capacity_kg=10000 + i,

                # Schedule
                schedule_type=f"Type {i}",
                schedule_detail=f"Detail {i}",
                special_restriction=f"Restriction {i}",

                # Contacts
                contact_org=f"Organization {i}",
                contact_phone=f"123-456-789{i}",
                contact_alt_phone=f"987-654-321{i}",
                contact_fax=f"555-555-555{i}",

                # Webcams
                webcam_url_1=f"http://example.com/webcam1_{i}.jpg",
                webcam_url_2=f"http://example.com/webcam2_{i}.jpg",
                webcam_url_3=f"http://example.com/webcam3_{i}.jpg",
                webcam_url_4=f"http://example.com/webcam4_{i}.jpg",
                webcam_url_5='',
            )

    def test_ferry_list_caching(self):
        # Empty cache
        assert cache.get(CacheKey.FERRY_LIST) is None

        # Cache miss
        url = "/api/ferries/"
        response = self.client.get(url, {})
        assert len(response.data) == 10
        assert cache.get(CacheKey.FERRY_LIST) is not None

        # Cached result
        Ferry.objects.filter(id__gte=5).delete()
        response = self.client.get(url, {})
        assert len(response.data) == 10

        # Updated cached result
        FerryAPI().set_list_data()
        response = self.client.get(url, {})
        assert len(response.data) == 5
