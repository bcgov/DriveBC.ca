import datetime
import zoneinfo
from copy import copy

from apps.event import enums as event_enums
from apps.event.models import Event
from apps.event.serializers import EventSerializer
from apps.shared.tests import BaseTest
from django.contrib.gis.geos import LineString


class TestEventSerializer(BaseTest):
    def setUp(self):
        super().setUp()

        self.event = Event(
            # Description
            description="Test description for test construction event",
            event_type=event_enums.EVENT_TYPE.CONSTRUCTION,
            event_sub_type=event_enums.EVENT_SUB_TYPE.ROAD_CONSTRUCTION,

            # General status
            status=event_enums.EVENT_STATUS.ACTIVE,
            severity=event_enums.EVENT_SEVERITY.MAJOR,

            # Location
            direction=event_enums.EVENT_DIRECTION.NORTH,
            location=LineString([(-123.569743, 48.561231), (-123.569743, 48.561231)]),
            route_at="Test Highway",

            # Update status
            first_created=datetime.datetime(
                2023, 6, 2, 16, 42, 16,
                tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver")
            ),
            last_updated=datetime.datetime(
                2023, 6, 2, 16, 42, 16,
                tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver")
            ),
        )
        self.event.schedule =  {"intervals": [
          "2023-05-23T14:00/2023-07-22T14:00"
        ]
      }
        self.event_two = copy(self.event)

        self.event.id = "1"
        self.event.route_from = "at Test Road"
        self.event.route_to = "Test Avenue"
        
        self.event.save()

        self.event_two.id = "2"
        self.event_two.route_from = "Test Road Two"
        self.event_two.route_to = "Test Avenue Two"
        self.event_two.direction = event_enums.EVENT_DIRECTION.BOTH

        # Manually updated to Eastern time
        self.event_two.last_updated = datetime.datetime(
            2023, 6, 2, 16, 42, 16,
            tzinfo=zoneinfo.ZoneInfo(key="America/Toronto")
        )
        self.event_two.save()

        self.serializer = EventSerializer(self.event)
        self.serializer_two = EventSerializer(self.event_two)

    def test_serializer_data(self):
        assert len(self.serializer.data) == 18
        # route_from beings with 'at '
        assert self.serializer.data['route_display'] == \
               "Test Road to Test Avenue"
        assert self.serializer.data['direction_display'] == \
               "Northbound"

        assert len(self.serializer_two.data) == 18
        # route_from doesn't being with 'at '
        assert self.serializer_two.data['route_display'] == \
               "Test Road Two to Test Avenue Two"
        assert self.serializer_two.data['direction_display'] == \
               "Both Directions"

        # Eastern time auto adjusted to Pacific time
        assert self.serializer_two.data['last_updated'] == \
               '2023-06-02T13:42:16-07:00'
