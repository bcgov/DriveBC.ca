import datetime
import json
import logging
import zoneinfo
from http.client import INTERNAL_SERVER_ERROR
from pathlib import Path
from unittest.mock import patch

import pytest
from apps.event import enums as event_enums
from apps.event.enums import EVENT_DIRECTION, EVENT_STATUS
from apps.event.helpers import get_display_category
from apps.event.models import Event
from apps.event.tasks import populate_all_event_data, populate_event_from_data
from apps.event.tests.test_data.event_parsed_feed import parsed_feed, parsed_feed_2
from apps.shared.tests import BaseTest, MockResponse
from django.contrib.gis.geos import LineString, Point
from httpx import HTTPStatusError

# suppress logged error messages to reduce noise
logging.getLogger().setLevel(logging.CRITICAL)


class TestEventModel(BaseTest):
    def setUp(self):
        super().setUp()

        data_dir = str(Path(__file__).parent) + "/test_data/"

        # Normal feed
        event_feed_data = open(data_dir + "event_feed_list_of_five.json")
        self.mock_event_feed_result = json.load(event_feed_data)
        cars_feed_data = open(data_dir + "cars_feed_list_of_five.json")
        self.mock_cars_feed_result = json.load(cars_feed_data)

        # Feed with one missing event from normal feed
        event_feed_data_with_missing_event = open(
            data_dir + "event_feed_list_of_four.json"
        )
        self.mock_event_feed_result_with_missing_event = json.load(
            event_feed_data_with_missing_event
        )

        # Updated feed with one missing event
        event_feed_data = open(data_dir + "event_feed_list_of_four_updated.json")
        self.mock_updated_event_feed_result = json.load(event_feed_data)

        # Feed with error in data
        event_feed_data_with_errors = open(
            data_dir + "event_feed_list_of_five_with_validation_error.json"
        )
        self.mock_event_feed_result_with_errors = json.load(
            event_feed_data_with_errors
        )

        # Parsed python dict
        self.parsed_feed = parsed_feed
        self.parsed_feed_2 = parsed_feed_2

    def test_populate_event_function(self):
        populate_event_from_data(self.parsed_feed)

        event_one = Event.objects.get(id="DBC-52446")

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

    def test_populate_event_function_2(self):
        Event.objects.create(
            id="DBC-3175",

            description="Quesnel-Hixon Road, in both directions. "
                        "Landslide at Cottonwood bridge. "
                        "Road closed. "
                        "Next update time Wed Jul 12 at 2:00 PM PDT. "
                        "Last updated Thu Apr 13 at 10:30 AM PDT. (DBC-28386)",
            event_type=event_enums.EVENT_TYPE.CONSTRUCTION,
            event_sub_type=event_enums.EVENT_SUB_TYPE.ROAD_CONSTRUCTION,

            # General status
            status=event_enums.EVENT_STATUS.ACTIVE,
            severity=event_enums.EVENT_SEVERITY.MAJOR,

            # Location
            direction=event_enums.EVENT_DIRECTION.NORTH,
            location=Point(-120.526427, 49.451752),
            # location={"coordinates": Point([-120.526427, 49.451752])},
            route_at="Test Highway",

            # Update status
            first_created=datetime.datetime(
                2023, 6, 2, 16, 42, 16,
                tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver")
            ),
            next_update=datetime.datetime(
                2023, 6, 10, 16, 42, 16,
                tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver")
            ),
            last_updated=datetime.datetime(
                2023, 6, 2, 16, 42, 16,
                tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver")
            ),

            schedule={
                "intervals": [
                    "2023-05-23T14:00/2023-07-22T14:00"
                ]
            },

            route_from="at Test Road",
            route_to="Test Avenue",
        )

        # Normal feed
        event_feed_data = open(
            str(Path(__file__).parent) +
            "/test_data/event_feed_list_of_one.json"
        )
        self.mock_event_feed_result = json.load(event_feed_data)
        populate_event_from_data(self.mock_event_feed_result['events'][0])

    @patch("httpx.get")
    def test_populate_and_update_event(self, mock_requests_get):
        mock_requests_get.side_effect = [
            # populate_all_event_data results in two feed calls: cars, then open511
            MockResponse(self.mock_cars_feed_result, status_code=200),
            MockResponse(self.mock_event_feed_result, status_code=200),
            MockResponse(self.mock_cars_feed_result, status_code=200),
            MockResponse(self.mock_event_feed_result_with_missing_event,
                         status_code=200),
            MockResponse(self.mock_cars_feed_result, status_code=200),
            MockResponse(self.mock_updated_event_feed_result, status_code=200),
        ]

        populate_all_event_data()
        assert Event.objects.count() == 5

        event_id_list = sorted(Event.objects.all().order_by("id")
                               .values_list("id", flat=True))
        assert event_id_list == [
            "DBC-28386",
            "DBC-46014",
            "DBC-52446",
            "DBC-52791",
            "DBC-53145"
        ]

        # NONE direction
        event = Event.objects.get(id="DBC-52446")
        assert event.direction == EVENT_DIRECTION.NONE
        # closed value comes from CARS feed
        event = Event.objects.get(id="DBC-46014")
        assert event.closed is True

        # Second call with one missing event
        populate_all_event_data()

        assert Event.objects.filter(status=EVENT_STATUS.ACTIVE).count() == 4
        # Inactive events are deleted
        assert Event.objects.filter(id="DBC-28386").count() == 0

        # Third call with updated data
        populate_all_event_data()
        # Not updated due to same updated datetime
        assert Event.objects.get(id="DBC-46014").route_from \
               != "Updated Rd"

        # Updated due to different updated datetime
        assert Event.objects.get(id="DBC-53145").route_from \
               == "Updated Trail"

    @patch("httpx.get")
    def test_populate_event_with_validation_error(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse([], status_code=200),
            MockResponse(self.mock_event_feed_result_with_errors, status_code=200),
        ]

        # Only cams with validation error(DBC-46014) are omitted
        populate_all_event_data()
        assert Event.objects.count() == 4

        event_id_list = sorted(Event.objects.all().values_list("id", flat=True))
        assert event_id_list == [
            "DBC-28386",
            "DBC-52446",
            "DBC-52791",
            "DBC-53145"
        ]

    @patch("httpx.get")
    def test_event_feed_client_error(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse([], status_code=200),
            MockResponse({}, status_code=INTERNAL_SERVER_ERROR),
        ]

        with pytest.raises(HTTPStatusError):
            populate_all_event_data()

        assert Event.objects.count() == 0

    def test_display_category(self):
        data = {
            'closed': False,
            'closest_landmark': '5 km west of Purden Lake',
            'description': 'Highway 16 (Yellowhead Highway). Paving operations between Willow River Rest Area and '
                           'Bowron Pit Rd (5 km west of Purden Lake.... From 8:00 AM to 8:00 PM PDT on Wednesday, '
                           'Thursday, Friday and Saturday. Last updated Tue May 27 at 8:00 AM PDT. (DBC-20342)',
            'direction': 'NONE',
            'event_sub_type': 'ROAD_MAINTENANCE',
            'event_type': 'CONSTRUCTION',
            'first_created': datetime.datetime(
                2025, 5, 27, 8, 0, 35, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver')),
            'highway_segment_names': '',
            'id': 'DBC-20342',
            'last_updated': datetime.datetime(2025, 5, 28, 0, 0, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver')),
            'location': {
                'coordinates': [-122.063117, 53.903021],
                'type': 'Point'
            },
            'location_description': 'Between Willow River Rest Area and Bowron Pit Rd',
            'next_update': None,
            'route_at': 'Highway 16',
            'route_from': 'Willow River Rest Area',
            'route_to': '',
            'schedule': {
                'recurring_schedules': [
                    {
                        'daily_end_time': '20:00',
                        'daily_start_time': '08:00',
                        'days': [3, 4, 5, 6],
                        'end_date': '2025-06-01',
                        'start_date': '2025-05-28'
                    }
                ]
            },
            'severity': 'MINOR',
            'start_point_linear_reference': 1076.938270924779,
            'status': 'ACTIVE',
            'timezone': 'America/Vancouver'
        }
        populate_event_from_data(data)
        event = Event.objects.get(id='DBC-20342')

        dc1 = get_display_category(
            event,
            datetime.datetime(2025, 5, 28, 7, 59, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver'))
        )
        assert dc1 == event_enums.EVENT_DISPLAY_CATEGORY.FUTURE_DELAYS

        dc2 = get_display_category(
            event,
            datetime.datetime(2025, 5, 28, 8, 0, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver'))
        )
        assert dc2 == event_enums.EVENT_DISPLAY_CATEGORY.MINOR_DELAYS

        dc3 = get_display_category(
            event,
            datetime.datetime(2025, 5, 28, 8, 1, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver'))
        )
        assert dc3 == event_enums.EVENT_DISPLAY_CATEGORY.MINOR_DELAYS
