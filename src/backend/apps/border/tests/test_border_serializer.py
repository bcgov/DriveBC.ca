import zoneinfo
from datetime import datetime, time

from apps.border.enums import LANE_DIRECTION, LANE_TYPE
from apps.border.models import BorderCrossing, BorderCrossingLanes
from apps.border.serializers import (
    BorderCrossingLanesSerializer,
    BorderCrossingSerializer,
)
from apps.shared.tests import BaseTest
from django.contrib.gis.geos import Point


class TestBorderSerializer(BaseTest):
    def setUp(self):
        super().setUp()

        # Delete data from fixture
        BorderCrossing.objects.all().delete()

        # Generic border crossing
        self.border_crossing = BorderCrossing(
            id=134,
            name="Peace Arch",
            location=Point(-122.757, 49.003),
        )
        self.border_crossing.save()

        self.lane = BorderCrossingLanes(
            id=1,
            border_crossing=self.border_crossing,
            lane_type=LANE_TYPE.CARS,
            lane_direction=LANE_DIRECTION.NORTHBOUND,
            delay_minutes=10,
            last_updated=datetime(2025, 3, 4, 8, 1, 3, tzinfo=zoneinfo.ZoneInfo("America/Vancouver"))
        )
        self.lane.save()

        self.lane2 = BorderCrossingLanes(
            id=2,
            border_crossing=self.border_crossing,
            lane_type=LANE_TYPE.CARS,
            lane_direction=LANE_DIRECTION.NORTHBOUND,
            delay_minutes=None,
            last_updated=None
        )
        self.lane2.save()

        self.lane3 = BorderCrossingLanes(
            id=3,
            border_crossing=self.border_crossing,
            lane_type=LANE_TYPE.CARS,
            lane_direction=LANE_DIRECTION.NORTHBOUND,
            delay_minutes=3,
            last_updated=datetime(2025, 5, 4, 8, 1, 3, tzinfo=zoneinfo.ZoneInfo("America/Vancouver"))
        )
        self.lane3.save()

        self.serializer = BorderCrossingSerializer(self.border_crossing)

        # Aldergrove
        self.aldergrove_border_crossing = BorderCrossing(
            id=136,
            name="Aldergrove",
            location=Point(-122.757, 49.003),
        )
        self.aldergrove_border_crossing.save()

        self.aldergrove_general_lane = BorderCrossingLanes(
            id=4,
            border_crossing=self.aldergrove_border_crossing,
            lane_type=LANE_TYPE.CARS,
            lane_direction=LANE_DIRECTION.SOUTHBOUND,
            delay_minutes=5,
            last_updated=datetime(2025, 5, 4, 8, 1, 3, tzinfo=zoneinfo.ZoneInfo("America/Vancouver"))
        )
        self.aldergrove_general_lane.save()

        self.aldergrove_nexus_lane = BorderCrossingLanes(
            id=758,
            border_crossing=self.aldergrove_border_crossing,
            lane_type=LANE_TYPE.NEXUS,
            lane_direction=LANE_DIRECTION.NORTHBOUND,
            delay_minutes=5,
            last_updated=datetime(2025, 5, 4, 8, 1, 3, tzinfo=zoneinfo.ZoneInfo("America/Vancouver"))
        )
        self.aldergrove_nexus_lane.save()

    def test_serializer_data(self):
        assert self.serializer.data["name"] == "Peace Arch"
        assert self.serializer.data["location"] == {"type": "Point", "coordinates": [-122.757, 49.003]}
        assert (self.serializer.data["last_updated"] ==
                datetime(2025, 5, 4, 8, 1, 3, tzinfo=zoneinfo.ZoneInfo("America/Vancouver")))

        # Lanes
        assert len(self.serializer.data["lanes"]) == 3

        assert self.serializer.data["lanes"][0]["lane_type"] == LANE_TYPE.CARS
        assert self.serializer.data["lanes"][0]["lane_direction"] == LANE_DIRECTION.NORTHBOUND
        assert self.serializer.data["lanes"][0]["delay_minutes"] == 10
        assert self.serializer.data["lanes"][0]["last_updated"] == '2025-03-04T08:01:03-08:00'

    def test_get_delay_minutes(self):
        # Test Aldergrove NEXUS lane closed
        serializer = BorderCrossingLanesSerializer()
        test_time = time(21, 0)  # 9 PM
        delay_minutes = serializer.get_delay_minutes(self.aldergrove_nexus_lane, test_time)
        assert delay_minutes == 'closed'

        # Test Aldergrove NEXUS lane open
        test_time = time(13, 0)  # 1 PM
        delay_minutes = serializer.get_delay_minutes(self.aldergrove_nexus_lane, test_time)
        assert delay_minutes == 5

        # Test other Aldergrove lane closed
        test_time = time(2, 0)  # 2 AM
        delay_minutes = serializer.get_delay_minutes(self.aldergrove_general_lane, test_time)
        assert delay_minutes == 'closed'

        # Test other Aldergrove lane open
        test_time = time(9, 0)  # 9 AM
        delay_minutes = serializer.get_delay_minutes(self.aldergrove_general_lane, test_time)
        assert delay_minutes == 5

        # Test other lane not affected by time
        test_time = time(9, 0)  # 9 AM
        delay_minutes = serializer.get_delay_minutes(self.lane, test_time)
        assert delay_minutes == 10
