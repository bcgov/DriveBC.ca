import json
import logging
from http.client import INTERNAL_SERVER_ERROR
from pathlib import Path
from unittest.mock import patch

import pytest
from apps.shared.models import Area
from apps.shared.tasks import populate_all_district_data, populate_district_from_data
from apps.shared.tests import BaseTest, MockResponse
from apps.shared.tests.test_data.district_parsed_feed import parsed_feed
from django.contrib.gis.geos import Polygon
from httpx import HTTPStatusError

# suppress logged error messages to reduce noise
logging.getLogger().setLevel(logging.CRITICAL)


class TestDistrictModel(BaseTest):
    def setUp(self):
        super().setUp()

        Area.objects.all().delete()

        # Normal feed
        district_feed_data = open(
            str(Path(__file__).parent) +
            "/test_data/district_feed_list.json"
        )
        self.mock_district_feed_result = json.load(district_feed_data)

        # Manually updated feed with one less ferry vessel
        district_feed_data = open(
            str(Path(__file__).parent) +
            "/test_data/district_feed_list_updated.json"
        )
        self.mock_updated_district_feed_result = json.load(district_feed_data)

        self.parsed_feed = parsed_feed

    def test_populate_district_function(self):
        populate_district_from_data(self.parsed_feed[0])

        district_one = Area.objects.get(id=1)

        # General
        assert district_one.id == 1
        assert district_one.name == 'Lower Mainland'
        assert isinstance(district_one.geometry, Polygon)
        assert district_one.geometry.coords[0][0] == (-126.05000031, 51.9999999)
        assert district_one.geometry.coords[0][1] == (-126.09999975, 51.99999984)
        assert district_one.geometry.coords[0][-1] == (-126.05000031, 51.9999999)

    @patch("httpx.get")
    def test_populate_and_update_districts(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse(self.mock_district_feed_result, status_code=200),
            MockResponse(self.mock_updated_district_feed_result, status_code=200),
        ]

        populate_all_district_data()
        assert Area.objects.count() == 1

        # validate data
        district = Area.objects.get(id=1)
        assert district.name == "Lower Mainland"
        assert district.geometry.coords[0][0] == (-126.05000031, 51.9999999)
        assert district.geometry.coords[0][1] == (-126.09999975, 51.99999984)
        assert district.geometry.coords[0][-1] == (-126.05000031, 51.9999999)

        # Second call with one updated district
        populate_all_district_data()

        # validate data
        district = Area.objects.get(id=1)
        assert district.name == "Lower Mainland new name"
        assert district.geometry.coords[0][0] == (-126.03000031, 51.9999999)
        assert district.geometry.coords[0][1] == (-126.09999975, 51.99999984)
        assert district.geometry.coords[0][-1] == (-126.03000031, 51.9999999)

    @patch("httpx.get")
    def test_district_feed_client_error(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse({}, status_code=INTERNAL_SERVER_ERROR),
        ]

        with pytest.raises(HTTPStatusError):
            populate_all_district_data()

        assert Area.objects.count() == 0
