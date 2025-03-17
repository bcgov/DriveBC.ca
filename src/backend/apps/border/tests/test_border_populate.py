import json
import zoneinfo
from datetime import datetime
from pathlib import Path
from unittest.mock import patch

from apps.border.enums import LANE_DIRECTION, LANE_TYPE
from apps.border.models import BorderCrossing, BorderCrossingLanes
from apps.border.tasks import update_border_crossing_lanes
from apps.shared.tests import MockResponse
from django.test import TestCase


class BorderPopulateTestCase(TestCase):
    def setUp(self):
        super().setUp()

        # Normal feed
        border_lane_delay_feed = open(
            str(Path(__file__).parent) +
            "/test_data/border_lane_delay.json"
        )
        self.mock_border_lane_delay_feed = json.load(border_lane_delay_feed)

    def tearDown(self):
        super().tearDown()

        BorderCrossingLanes.objects.all().update(delay_minutes=None, last_updated=None)

    @patch("requests.get")
    def test_border_populate(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse(self.mock_border_lane_delay_feed, status_code=200),
        ]

        # Call the populate_border_crossings function
        update_border_crossing_lanes(True)

        # Check that border crossings and lanes have been created
        assert BorderCrossing.objects.count() == 4
        assert BorderCrossingLanes.objects.count() == 21

        # Verify specific border crossings and lanes
        peace_arch = BorderCrossing.objects.get(id=134)
        assert peace_arch.name == 'Peace Arch'
        assert peace_arch.bordercrossinglanes_set.count() == 4

        pacific_highway = BorderCrossing.objects.get(id=135)
        assert pacific_highway.name == 'Pacific Highway'
        assert pacific_highway.bordercrossinglanes_set.count() == 8

        lynden_aldergrove = BorderCrossing.objects.get(id=136)
        assert lynden_aldergrove.name == 'Lynden/Aldergrove'
        assert lynden_aldergrove.bordercrossinglanes_set.count() == 5

        sumas_huntingdon = BorderCrossing.objects.get(id=137)
        assert sumas_huntingdon.name == 'Sumas/Huntingdon'
        assert sumas_huntingdon.bordercrossinglanes_set.count() == 4

        # Verify specific border crossing lanes
        pacific_highway_southbound_cars = BorderCrossingLanes.objects.get(id=3)
        assert pacific_highway_southbound_cars.lane_type == LANE_TYPE.CARS
        assert pacific_highway_southbound_cars.lane_direction == LANE_DIRECTION.SOUTHBOUND
        assert pacific_highway_southbound_cars.delay_minutes == 14
        assert (pacific_highway_southbound_cars.last_updated ==
                datetime(
                    2025, 3, 4, 8, 1, 3,
                    tzinfo=zoneinfo.ZoneInfo("America/Vancouver")
                ))
