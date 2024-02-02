import datetime
import json
import zoneinfo
from http.client import INTERNAL_SERVER_ERROR
from pathlib import Path
from unittest.mock import patch

import pytest
from apps.event.enums import EVENT_DIRECTION, EVENT_STATUS
from apps.event.models import Event
from apps.event.tasks import populate_all_event_data, populate_event_from_data
from apps.event.tests.test_data.event_parsed_feed import parsed_feed
from apps.shared.tests import BaseTest, MockResponse
from django.contrib.gis.geos import LineString
from httpx import HTTPStatusError


class TestEventModel(BaseTest):
    def setUp(self):
        super().setUp()

        # Normal feed
        event_feed_data = open(
            str(Path(__file__).parent) +
            "/test_data/event_feed_list_of_five.json"
        )
        self.mock_event_feed_result = json.load(event_feed_data)

        # Feed with one missing event from normal feed
        event_feed_data_with_missing_event = open(
            str(Path(__file__).parent) +
            "/test_data/event_feed_list_of_four.json"
        )
        self.mock_event_feed_result_with_missing_event = \
            json.load(event_feed_data_with_missing_event)

        # Updated feed with one missing event
        event_feed_data = open(
            str(Path(__file__).parent) +
            "/test_data/event_feed_list_of_four_updated.json"
        )
        self.mock_updated_event_feed_result = json.load(event_feed_data)

        # Feed with error in data
        event_feed_data_with_errors = open(
            str(Path(__file__).parent)
            + "/test_data/event_feed_list_of_five_with_validation_error.json"
        )
        self.mock_event_feed_result_with_errors = json.load(
            event_feed_data_with_errors
        )

        # Parsed python dict
        self.parsed_feed = parsed_feed

    def test_populate_event_function(self):
        populate_event_from_data(self.parsed_feed)

        event_one = Event.objects.get(id="drivebc.ca/DBC-52446")

        # Description
        assert event_one.description == \
               "Highway 3. Road maintenance work between Bromley Pl " \
               "and Frontage Rd for 0.6 km (Princeton). Until Sat " \
               "Jul 22 at 7:00 AM PDT. Single lane alternating traffic. " \
               "Next update time Fri Jul 21 at 1:00 PM PDT. " \
               "Last updated Thu Jun 29 at 10:14 AM PDT. (DBC-52446)"
        assert event_one.event_type == "CONSTRUCTION"
        assert event_one.event_sub_type == "ROAD_MAINTENANCE"

        # Location
        assert event_one.status == "ACTIVE"
        assert event_one.severity == "MAJOR"
        assert event_one.direction == "NONE"
        assert event_one.location.equals(LineString([
            [-120.528796, 49.446318],
            [-120.528342, 49.447589],
            [-120.527977, 49.448609],
            [-120.527803, 49.449096],
            [-120.527031, 49.450689],
            [-120.526853, 49.451003],
            [-120.526427, 49.451752]
        ])) is True
        assert event_one.route_at == "Highway 3"
        assert event_one.route_from == "Bromley Pl"
        assert event_one.route_to == "Frontage Rd"
        assert event_one.first_created == datetime.datetime(
            2023, 5, 19, 14, 29, 20, tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver")
        )
        assert event_one.last_updated == datetime.datetime(
            2023, 6, 29, 10, 14, 55, tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver")
        )

    @patch("httpx.get")
    def test_populate_and_update_event(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse(self.mock_event_feed_result, status_code=200),
            MockResponse(self.mock_event_feed_result_with_missing_event,
                         status_code=200),
            MockResponse(self.mock_updated_event_feed_result, status_code=200),
        ]

        populate_all_event_data(include_closures=False)
        assert Event.objects.count() == 5

        event_id_list = sorted(Event.objects.all().order_by("id")
                               .values_list("id", flat=True))
        assert event_id_list == [
            "drivebc.ca/DBC-28386",
            "drivebc.ca/DBC-46014",
            "drivebc.ca/DBC-52446",
            "drivebc.ca/DBC-52791",
            "drivebc.ca/DBC-53145"
        ]

        # NONE direction
        event = Event.objects.get(id="drivebc.ca/DBC-52446")
        assert event.direction == EVENT_DIRECTION.NONE

        # Second call with one missing event
        populate_all_event_data(include_closures=False)

        assert Event.objects.filter(status=EVENT_STATUS.ACTIVE).count() == 4
        # Inactive events are deleted
        assert Event.objects.filter(id="drivebc.ca/DBC-28386").count() == 0

        # Third call with updated data
        populate_all_event_data(include_closures=False)
        # Not updated due to same updated datetime
        assert Event.objects.get(id="drivebc.ca/DBC-46014").route_from \
               != "Updated Rd"

        # Updated due to different updated datetime
        assert Event.objects.get(id="drivebc.ca/DBC-53145").route_from \
               == "Updated Trail"

    @patch("httpx.get")
    def test_populate_event_with_validation_error(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse(self.mock_event_feed_result_with_errors, status_code=200),
        ]

        # Only cams with validation error(DBC-46014) are omitted
        populate_all_event_data(include_closures=False)
        assert Event.objects.count() == 4

        event_id_list = sorted(Event.objects.all().values_list("id", flat=True))
        assert event_id_list == [
            "drivebc.ca/DBC-28386",
            "drivebc.ca/DBC-52446",
            "drivebc.ca/DBC-52791",
            "drivebc.ca/DBC-53145"
        ]

    @patch("httpx.get")
    def test_event_feed_client_error(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse({}, status_code=INTERNAL_SERVER_ERROR),
        ]

        with pytest.raises(HTTPStatusError):
            populate_all_event_data()

        assert Event.objects.count() == 0
