import json
from pathlib import Path

from apps.feed.serializers import FerryAPISerializer
from apps.shared.tests import BaseTest


class TestFerryFeedSerializer(BaseTest):
    def setUp(self):
        super().setUp()

        ferry_data_path = str(Path(__file__).parent) + "/test_data/ferry_feed_list_of_one.json"
        with open(ferry_data_path) as f:
            self.ferry_data = json.load(f)

    def test_ferry_to_internal_value(self):
        ferry_serializer = FerryAPISerializer(data=self.ferry_data)
        ferry_serializer.is_valid(raise_exception=True)

        ferries_list = ferry_serializer.validated_data
        assert len(ferries_list["features"]) == 1

        ferry_data = ferries_list["features"][0]

        # General
        assert ferry_data["id"] == 10
        assert ferry_data["name"] == ''
        assert ferry_data["route_id"] == 9
        assert ferry_data["route_name"] == 'Little Fort Reaction Ferry'
        assert (ferry_data["route_description"] ==
                'The Little Fort ferry runs across the North Thompson River, 93 kilometres north of Kamloops on Highway 5.')

        # Urls
        assert (ferry_data["url"] ==
                'https://www2.gov.bc.ca/gov/content/transportation/' +
                'passenger-travel/water-travel/inland-ferries/little-fort-reaction-ferry')
        assert (ferry_data["image_url"] ==
                'https://www2.gov.bc.ca/assets/gov/driving-and-transportation/passenger/inland-ferries/photos/littlefort.jpg')
        assert (ferry_data["route_image_url"] ==
                'https://www2.gov.bc.ca/assets/gov/driving-and-transportation/passenger/'
                'inland-ferries/maps/littlefortferry_map.jpg')

        # Capacity
        assert ferry_data["vehicle_capacity"] == 2
        assert ferry_data["passenger_capacity"] == 12
        assert ferry_data["crossing_time_min"] == 5
        assert ferry_data["weight_capacity_kg"] is None

        # Schedule
        assert ferry_data["schedule_type"] == 'On Demand Morning to Evening With Gaps'
        assert ferry_data["schedule_detail"] == (
            "\u003Cp\u003E\u003Cstrong\u003EService "
            "hours:\u003C/strong\u003E\u003C/p\u003E "
            "\u003Cp\u003EOn demand\u003C/p\u003E "
            "\u003Cul\u003E \u003Cli\u003E6:45 am "
            "&ndash; 10 am\u003C/li\u003E \u003Cli\u003E11 "
            "am &ndash; 2:45 pm\u003C/li\u003E "
            "\u003Cli\u003E3:15 pm &ndash; 7 pm\u003C/li\u003E "
            "\u003Cli\u003E8 pm &ndash; 11:15 pm\u003C/li\u003E "
            "\u003C/ul\u003E"
        )
        assert (ferry_data["special_restriction"] ==
                'Maximum carrying capacity 9 tonnes, approximately 2 passenger ' +
                'vehicles. Vehicle combination cannot exceed 12m.')

        # Contacts
        assert ferry_data["contact_org"] == 'Argo Road Maintenance Inc.'
        assert ferry_data["contact_phone"] == '2503746690'
        assert ferry_data["contact_alt_phone"] == '18006612025'
        assert ferry_data["contact_fax"] == '2503746613'

        # Webcams
        assert ferry_data["webcam_url_1"] == 'https://images.drivebc.ca/bchighwaycam/pub/cameras/304.jpg'
        assert ferry_data["webcam_url_2"] == 'https://images.drivebc.ca/bchighwaycam/pub/cameras/1031.jpg'
        assert ferry_data["webcam_url_3"] == 'https://images.drivebc.ca/bchighwaycam/pub/cameras/303.jpg'
        assert ferry_data["webcam_url_4"] == 'https://images.drivebc.ca/bchighwaycam/pub/cameras/1030.jpg'
        assert ferry_data["webcam_url_5"] == ''

        # Meta
        assert ferry_data["feed_created_at"] == '2024-11-14T18:26:16Z'
        assert ferry_data["feed_modified_at"] == '2024-11-14T18:26:16Z'
