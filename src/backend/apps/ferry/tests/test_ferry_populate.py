import json
import logging
from http.client import INTERNAL_SERVER_ERROR
from pathlib import Path
from unittest.mock import patch

import pytest
from apps.ferry.models import Ferry
from apps.ferry.tasks import populate_all_ferry_data, populate_ferry_from_data
from apps.ferry.tests.test_data.ferry_parsed_feed import parsed_feed
from apps.shared.tests import BaseTest, MockResponse
from django.contrib.gis.geos import Point
from httpx import HTTPStatusError

# suppress logged error messages to reduce noise
logging.getLogger().setLevel(logging.CRITICAL)


class TestFerryModel(BaseTest):
    def setUp(self):
        super().setUp()

        # Normal feed
        ferry_feed_data = open(
            str(Path(__file__).parent) +
            "/test_data/ferry_feed_list.json"
        )
        self.mock_ferry_feed_result = json.load(ferry_feed_data)

        # Manually updated feed with one less ferry vessel
        ferry_feed_data = open(
            str(Path(__file__).parent) +
            "/test_data/ferry_feed_list_updated.json"
        )
        self.mock_updated_ferry_feed_result = json.load(ferry_feed_data)

        self.parsed_feed = parsed_feed

    def test_populate_ferry_function(self):
        populate_ferry_from_data(self.parsed_feed)

        ferry_one = Ferry.objects.get(id=1)

        # General
        assert ferry_one.id == 1
        assert ferry_one.name == ''
        assert ferry_one.route_id == 1
        assert ferry_one.route_name == "Adam's Lake Cable Ferry"
        assert (ferry_one.route_description ==
                'The Adams Lake ferry runs across Adams Lake, '
                '20km north of Highway 1 between Chase and Sorrento. '
                'The ferry is located approximately 80km northeast of '
                'Kamloops and 50km northwest of Salmon Arm.')

        # Urls
        assert (ferry_one.url ==
                'https://www2.gov.bc.ca/gov/content/transportation/'
                'passenger-travel/water-travel/inland-ferries/adams-'
                'lake-cable-ferry')
        assert (ferry_one.image_url ==
                'https://www2.gov.bc.ca/assets/gov/driving-and-transportation/passenger/inland-ferries/photos/adamslakeii.jpg')
        assert (ferry_one.route_image_url ==
                'https://www2.gov.bc.ca/assets/gov/driving-and-transportation/passenger/'
                'inland-ferries/maps/adamslakecableferry_map.jpg')

        # Location
        assert ferry_one.location.equals(Point(1443586.90943286, 680099.30986824))

        # Capacity
        assert ferry_one.vehicle_capacity == 10
        assert ferry_one.passenger_capacity == 48
        assert ferry_one.crossing_time_min == 6
        assert ferry_one.weight_capacity_kg == 34000

        # Schedule
        assert ferry_one.schedule_type == 'On Demand 24hr With Gaps'
        assert ferry_one.schedule_detail == (
            "<p><strong>Service hours</strong>:</p> <p>On demand, "
            "24-hours</p> <ul> <li>5 am - 3 am</li> <li>3 am - 5 am "
            "(emergency only)</li> </ul>"
        )
        assert ferry_one.special_restriction == ''

        # Contacts
        assert ferry_one.contact_org == 'WaterBridge Ferries Inc.'
        assert ferry_one.contact_phone == '2502652105'
        assert ferry_one.contact_alt_phone == ''
        assert ferry_one.contact_fax == '2502652192'

        # Webcams
        assert ferry_one.webcam_url_1 == 'https://images.drivebc.ca/bchighwaycam/pub/cameras/1102.jpg'
        assert ferry_one.webcam_url_2 == 'https://images.drivebc.ca/bchighwaycam/pub/cameras/1095.jpg'
        assert ferry_one.webcam_url_3 == 'https://images.drivebc.ca/bchighwaycam/pub/cameras/1094.jpg'
        assert ferry_one.webcam_url_4 == ''
        assert ferry_one.webcam_url_5 == ''

    @patch("httpx.get")
    def test_populate_and_update_ferry(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse(self.mock_ferry_feed_result, status_code=200),
            MockResponse(self.mock_updated_ferry_feed_result, status_code=200),
        ]

        populate_all_ferry_data()
        assert Ferry.objects.count() == 15

        ferry_id_list = sorted(Ferry.objects.all().order_by("id")
                               .values_list("id", flat=True))
        assert ferry_id_list == [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]

        # validate data
        ferry = Ferry.objects.get(id=1)
        assert ferry.route_name == "Adam's Lake Cable Ferry"
        assert ferry.vehicle_capacity == 10

        # Second call with one updated and one missing event
        populate_all_ferry_data()

        updated_ferry_id_list = sorted(
            Ferry.objects.all().order_by("id")
            .values_list("id", flat=True)
        )
        assert updated_ferry_id_list == [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15]  # removed vessel 14

        # validate data
        ferry = Ferry.objects.get(id=1)
        assert ferry.route_name == "Updated Adam's Lake Cable Ferry"
        assert ferry.vehicle_capacity == 16

    @patch("httpx.get")
    def test_ferry_feed_client_error(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse({}, status_code=INTERNAL_SERVER_ERROR),
        ]

        with pytest.raises(HTTPStatusError):
            populate_all_ferry_data()

        assert Ferry.objects.count() == 0
