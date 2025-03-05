import zoneinfo
from datetime import datetime

from apps.border.enums import LANE_DIRECTION, LANE_TYPE
from apps.border.models import BorderCrossing, BorderCrossingLanes
from apps.border.serializers import BorderCrossingSerializer
from apps.shared.tests import BaseTest
from django.contrib.gis.geos import Point


class TestBorderSerializer(BaseTest):
    def setUp(self):
        super().setUp()

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
