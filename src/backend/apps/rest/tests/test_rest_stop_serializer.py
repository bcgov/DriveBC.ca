from apps.shared.tests import BaseTest
from apps.rest.models import RestStop
from apps.rest.serializers import RestStopSerializer


class TestRestStopSerializer(BaseTest):
    def setUp(self):
        super().setUp()

        self.rest_stop = RestStop(
            rest_stop_id="DBC_RIM_REST_AREA_V.fid-59dfb4f6_18e433c4f15_-52d9",
            geometry = {
                "type": "Point",
                "coordinates": [
                    54.66828166,
                    -126.99686259
            ]
            },
            properties = {
                "WI_FI": "No",
                "OBJECTID": 4381,
                "OPEN_DATE": None,
                "CLOSE_DATE": None,
                "POWER_TYPE": "No Power",
                "TOILET_TYPE": "Pit",
                "DIRECT_ACCESS": "Yes",
                "EVENT_LOCATION": 2.129,
                "HIGHWAY_NUMBER": "16",
                "REST_AREA_NAME": "BULKLEY VIEW",
                "ADMIN_UNIT_CODE": "425",
                "ADMIN_UNIT_NAME": "Bulkley Nass  SA",
                "OPEN_YEAR_ROUND": "Yes",
                "REST_AREA_CLASS": "RAM Class C",
                "NUMBER_OF_TABLES": 4,
                "REST_AREA_NUMBER": "R0146",
                "ACCELERATION_LANE": "No",
                "DECELERATION_LANE": "Yes",
                "NUMBER_OF_TOILETS": 1,
                "ACCESS_RESTRICTION": "Westbound",
                "CHRIS_REST_AREA_ID": "1532673",
                "DIRECTION_OF_TRAFFIC": "Eastbound",
                "POWER_RESPONSIBILITY": "Not Applicable",
                "EV_STATION_25_KW_DCFC": 0,
                "EV_STATION_50_KW_DCFC": 0,
                "CROSS_SECTION_POSITION": "Right of Way - Right",
                "ACCOM_COMMERCIAL_TRUCKS": "Yes",
                "CHRIS_ANCHOR_SECTION_ID": 1313674,
                "EV_STATION_LEVEL_2_J1772": 0,
                "WHEELCHAIR_ACCESS_TOILET": "Yes",
                "ASSOCIATED_NUMBERED_ROUTE": "16",
                "DISTANCE_FROM_MUNICIPALITY": "4.5 KM EAST OF TELKWA",
                "NUMBER_OF_STANDARD_BARRELS": 0,
                "NUMBER_OF_BEAR_PROOF_BARRELS": 6
            },
            bbox = [
                        -126.99686259,
                        54.66828166,
                        -126.99686259,
                        54.66828166
            ]
        )

        self.rest_stop_2 = RestStop(
            rest_stop_id="DBC_RIM_REST_AREA_V.fid-59dfb4f6_18e433c4f15_-52d8",
            geometry = {
                "type": "Point",
                "coordinates": [
                                54.84919263,
                                -127.22078727
                            ]
            },
            properties = {
                "WI_FI": "Yes",
                "OBJECTID": 30,
                "OPEN_DATE": None,
                "CLOSE_DATE": None,
                "POWER_TYPE": "No Power",
                "TOILET_TYPE": "Pit",
                "DIRECT_ACCESS": "Yes",
                "EVENT_LOCATION": 0.986,
                "HIGHWAY_NUMBER": "16",
                "REST_AREA_NAME": "GLACIER VIEW",
                "ADMIN_UNIT_CODE": "425",
                "ADMIN_UNIT_NAME": "Bulkley Nass  SA",
                "OPEN_YEAR_ROUND": "Yes",
                "REST_AREA_CLASS": "RAM Class C",
                "NUMBER_OF_TABLES": 3,
                "REST_AREA_NUMBER": "R0147",
                "ACCELERATION_LANE": "No",
                "DECELERATION_LANE": "No",
                "NUMBER_OF_TOILETS": 1,
                "ACCESS_RESTRICTION": "No Restriction",
                "CHRIS_REST_AREA_ID": "1532294",
                "DIRECTION_OF_TRAFFIC": "Eastbound",
                "POWER_RESPONSIBILITY": "Not Applicable",
                "EV_STATION_25_KW_DCFC": 0,
                "EV_STATION_50_KW_DCFC": 0,
                "CROSS_SECTION_POSITION": "Right of Way - Right",
                "ACCOM_COMMERCIAL_TRUCKS": "Yes",
                "CHRIS_ANCHOR_SECTION_ID": 1313727,
                "EV_STATION_LEVEL_2_J1772": 0,
                "WHEELCHAIR_ACCESS_TOILET": "Yes",
                "ASSOCIATED_NUMBERED_ROUTE": "16",
                "DISTANCE_FROM_MUNICIPALITY": "7.0KM NORTH OF SMITHERS",
                "NUMBER_OF_STANDARD_BARRELS": 0,
                "NUMBER_OF_BEAR_PROOF_BARRELS": 4
            },
            bbox = [
                        -127.22078727,
                        54.84919263,
                        -127.22078727,
                        54.84919263

            ]
                        
            
        )

        self.rest_stop.rest_stop_id = "DBC_RIM_REST_AREA_V.fid-59dfb4f6_18e433c4f15_-52d7"
        self.rest_stop.save()

        self.rest_stop_2.rest_stop_id = "DBC_RIM_REST_AREA_V.fid-59dfb4f6_18e433c4f15_-52d6"
        self.rest_stop_2.save()

        self.serializer = RestStopSerializer(self.rest_stop)
        self.serializer_two = RestStopSerializer(self.rest_stop_2)

    def test_serializer_data(self):
        assert len(self.serializer.data) == 7
        assert self.serializer.data['rest_stop_id'] == \
            "DBC_RIM_REST_AREA_V.fid-59dfb4f6_18e433c4f15_-52d7"
        assert self.serializer.data['location']['coordinates'][0] == -126.99686259
        assert self.serializer.data['location']['coordinates'][1] == 54.66828166

        assert self.serializer_two.data['rest_stop_id'] == \
            "DBC_RIM_REST_AREA_V.fid-59dfb4f6_18e433c4f15_-52d6"
        assert self.serializer_two.data['location']['coordinates'][0] == -127.22078727
        assert self.serializer_two.data['location']['coordinates'][1] == 54.84919263
