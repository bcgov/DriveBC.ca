import json
from pathlib import Path
from unittest.mock import patch

from apps.feed.client import FeedClient
from apps.rest.models import RestStop
from apps.rest.tasks import populate_rest_stop_from_data
from apps.rest.tests.test_data.rest_stop_parsed_feed import json_feed
from apps.shared.tests import BaseTest, MockResponse


class TestRestStopModel(BaseTest):
    def setUp(self):
        super().setUp()

        # Normal feed
        rest_stop_feed_data = open(
            str(Path(__file__).parent) +
            "/test_data/rest_stop_feed_list_of_two.json"
        )
        self.mock_rest_stop_feed_result = json.load(rest_stop_feed_data)
        self.json_feed = json_feed

        rest_stop_feed_data_rest_stop_one = open(
            str(Path(__file__).parent) +
            "/test_data/rest_stop_feed_list_of_one.json"
        )
        self.mock_rest_stop_feed_rest_stop_one = json.load(rest_stop_feed_data_rest_stop_one)

    def test_populate_rest_stop_function(self):
        populate_rest_stop_from_data(self.json_feed)
        rest_stop_one = RestStop.objects.get(rest_stop_id="1532673")
        assert rest_stop_one.location.y == -126.99686259
        assert rest_stop_one.location.x == 54.66828166

    def test_populate_rest_stop_function_with_existing_data(self):
        RestStop.objects.create(
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
        populate_rest_stop_from_data(self.json_feed)
        rest_stop_one = RestStop.objects.get(rest_stop_id="1464192")
        assert rest_stop_one.location.y == -119.31978552
        assert rest_stop_one.location.x == 52.98061363

    @patch('apps.feed.client.FeedClient.get_rest_stop_list')
    def test_populate_and_update_rest_stop(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse(self.mock_rest_stop_feed_result, status_code=200),
        ]
        response = self.mock_rest_stop_feed_result
        client = FeedClient()
        feed_data = client.get_rest_stop_list()
        feed_data = response

        for rest_stop_data in feed_data:
            populate_rest_stop_from_data(rest_stop_data)
        rest_stop_list_length = len(response)
        assert rest_stop_list_length == 2
