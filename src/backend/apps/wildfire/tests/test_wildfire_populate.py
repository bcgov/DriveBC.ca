import datetime
import json
import logging
from http.client import INTERNAL_SERVER_ERROR
from pathlib import Path
from unittest.mock import patch

import pytest
from apps.shared.tests import BaseTest, MockResponse
from apps.wildfire.models import Wildfire
from apps.wildfire.tasks import populate_all_wildfire_data, populate_wildfire_from_data
from apps.wildfire.tests.test_data.wildfire_parsed_feed import parsed_feed
from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from httpx import HTTPStatusError

# suppress logged error messages to reduce noise
logging.getLogger().setLevel(logging.CRITICAL)


class TestWildfireModel(BaseTest):
    def setUp(self):
        super().setUp()

        # Normal feed
        wildfire_area_feed_data = open(
            str(Path(__file__).parent) +
            "/test_data/wildfire_feed_area_list.json"
        )
        self.mock_wildfire_area_feed_result = json.load(wildfire_area_feed_data)

        wildfire_location_feed_data = open(
            str(Path(__file__).parent) +
            "/test_data/wildfire_feed_location_list.json"
        )
        self.mock_wildfire_location_feed_result = json.load(wildfire_location_feed_data)

        # Manually updated feed with one less ferry vessel
        wildfire_updated_area_feed_data = open(
            str(Path(__file__).parent) +
            "/test_data/wildfire_feed_area_list_updated.json"
        )
        self.mock_updated_wildfire_area_feed_result = json.load(wildfire_updated_area_feed_data)

        wildfire_updated_location_feed_data = open(
            str(Path(__file__).parent) +
            "/test_data/wildfire_feed_location_list_updated.json"
        )
        self.mock_updated_wildfire_location_feed_result = json.load(wildfire_updated_location_feed_data)

        self.parsed_feed = parsed_feed

    def test_populate_wildfire_function(self):
        # Polygon/Under Control
        populate_wildfire_from_data(self.parsed_feed[0])
        wildfire_one = Wildfire.objects.get(id='C50627')
        assert wildfire_one.id == 'C50627'
        assert wildfire_one.url == 'https://wildfiresituation.nrs.gov.bc.ca/incidents?fireYear=2025&incidentNumber=C50627'
        assert wildfire_one.name == 'Martin Lake'
        assert isinstance(wildfire_one.location, Point)
        assert isinstance(wildfire_one.geometry, Polygon)
        assert wildfire_one.size == 2244.5
        assert wildfire_one.status == "Under Control"
        assert wildfire_one.reported_date == datetime.date(2025, 6, 15)

        # Out, not populated
        populate_wildfire_from_data(self.parsed_feed[1])
        assert not Wildfire.objects.filter(id='C50448').exists()

        # MultiPolygon/Being Held
        populate_wildfire_from_data(self.parsed_feed[2])
        wildfire_two = Wildfire.objects.get(id='G70422')
        assert wildfire_two.id == 'G70422'
        assert wildfire_two.url == 'https://wildfiresituation.nrs.gov.bc.ca/incidents?fireYear=2025&incidentNumber=G70422'
        assert wildfire_two.name == 'Kiskatinaw River'
        assert isinstance(wildfire_two.location, Point)
        assert isinstance(wildfire_two.geometry, MultiPolygon)
        assert wildfire_two.size == 26276.8
        assert wildfire_two.status == "Being Held"
        assert wildfire_two.reported_date == datetime.date(2025, 5, 28)

    @patch("httpx.get")
    def test_populate_and_update_wildfires(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse(self.mock_wildfire_area_feed_result, status_code=200),
            MockResponse(self.mock_wildfire_location_feed_result, status_code=200),
            MockResponse(self.mock_updated_wildfire_area_feed_result, status_code=200),
            MockResponse(self.mock_updated_wildfire_location_feed_result, status_code=200),
        ]

        populate_all_wildfire_data()

        # validate data
        assert Wildfire.objects.count() == 2  # wildfires with "Out" not populated
        wildfire_one = Wildfire.objects.get(id='C50627')
        assert wildfire_one.reported_date == datetime.date(2025, 6, 15)

        wildfire_two = Wildfire.objects.get(id='G70422')
        assert wildfire_two.reported_date == datetime.date(2025, 5, 28)

        # Second call with one updated wildfire
        populate_all_wildfire_data()

        # validate data
        assert Wildfire.objects.count() == 1  # wildfires not active are removed
        assert not Wildfire.objects.filter(id='C50627').exists()
        assert Wildfire.objects.filter(id='G70422').exists()

    @patch("httpx.get")
    def test_wildfire_feed_client_error(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse({}, status_code=INTERNAL_SERVER_ERROR),
            MockResponse(self.mock_wildfire_location_feed_result, status_code=200),
        ]

        with pytest.raises(HTTPStatusError):
            populate_all_wildfire_data()

        assert Wildfire.objects.count() == 0
