from apps.rest.models import RestStop
from apps.rest.views import RestStopAPI
from apps.shared.enums import CacheKey
from apps.shared.tests import BaseTest
from django.core.cache import cache
from rest_framework.test import APITestCase


class TestRestStopAPI(APITestCase, BaseTest):
    def setUp(self):
        super().setUp()

        self.rest_stop = RestStop.objects.create(
            rest_stop_id="1464192",
            geometry={
                "type": "Point",
                "coordinates": [
                    52.98061363,
                    -119.31978552
                ]
            },
            properties={
                "WI_FI": "Yes",
                "OBJECTID": 10,
                "OPEN_DATE": None,
                "CLOSE_DATE": None,
                "POWER_TYPE": "Electrical",
                "TOILET_TYPE": "Flush",
                "DIRECT_ACCESS": "Yes",
                "EVENT_LOCATION": 0.064,
                "HIGHWAY_NUMBER": "16",
                "REST_AREA_NAME": "MT TERRY FOX 16",
                "ADMIN_UNIT_CODE": "420",
                "ADMIN_UNIT_NAME": "Robson  SA",
                "OPEN_YEAR_ROUND": "Yes",
                "REST_AREA_CLASS": "RAM Class A",
                "NUMBER_OF_TABLES": 10,
                "REST_AREA_NUMBER": "R0128",
                "ACCELERATION_LANE": "No",
                "DECELERATION_LANE": "No",
                "NUMBER_OF_TOILETS": 8,
                "ACCESS_RESTRICTION": "No Restriction",
                "CHRIS_REST_AREA_ID": "1464192",
                "DIRECTION_OF_TRAFFIC": "Eastbound",
                "POWER_RESPONSIBILITY": "Province",
                "EV_STATION_25_KW_DCFC": 0,
                "EV_STATION_50_KW_DCFC": 0,
                "CROSS_SECTION_POSITION": "Right of Way - Right",
                "ACCOM_COMMERCIAL_TRUCKS": "Yes",
                "CHRIS_ANCHOR_SECTION_ID": 1345872,
                "EV_STATION_LEVEL_2_J1772": 0,
                "WHEELCHAIR_ACCESS_TOILET": "Yes",
                "ASSOCIATED_NUMBERED_ROUTE": "16",
                "DISTANCE_FROM_MUNICIPALITY": "6.5KM EAST OF TETE JAUNE JUNCTION",
                "NUMBER_OF_STANDARD_BARRELS": 0,
                "NUMBER_OF_BEAR_PROOF_BARRELS": 6
            },
            bbox=[
                -119.31978552,
                52.98061363,
                -119.31978552,
                52.98061363
            ]
            )
        self.rest_stop.save()

    def test_rest_stop_list_caching(self):
        # Empty cache
        assert cache.get(CacheKey.REST_STOP_LIST) is None

        # Cache miss
        url = "/api/reststops"
        response = self.client.get(url, follow=True)
        assert len(response.data) == 1
        assert response.status_code == 200

        RestStopAPI().set_list_data()
        assert cache.get(CacheKey.REST_STOP_LIST) is not None

        # Cached result
        RestStop.objects.filter(rest_stop_id='1464192').delete()
        response = self.client.get(url, follow=True)
        assert len(response.data) == 1
        assert response.status_code == 200

        # Updated cached result
        RestStopAPI().set_list_data()
        response = self.client.get(url, follow=True)
        assert len(response.data) == 0
        assert response.status_code == 200

    def test_rest_stop_list_filtering(self):
        # No filtering
        url = "/api/reststops"
        # response = self.client.get(url, {})
        response = self.client.get(url, follow=True)
        assert response.status_code == 200
        assert len(response.data) == 1

        # Manually update location code
        rest_stop = RestStop.objects.get(rest_stop_id='1464192')
        rest_stop.rest_stop_id = '1464193'  # TODO: what are we testing here?
        rest_stop.save()
        rest_stop = RestStop.objects.get(rest_stop_id='1464193')
        assert response.status_code == 200
        assert len(response.data) == 1

        response = self.client.get(url, follow=True)
        assert len(response.data) == 1
