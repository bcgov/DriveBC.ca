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
        self.event.schedule = {
            "intervals": [
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
        # Manually set to future schedule to test future display category
        self.event_two.schedule = {
            'recurring_schedules': [
                {
                    'daily_end_time': '17:00',
                    'daily_start_time': '07:00',
                    'days': [2, 3, 4, 5],
                    'end_date': '2054-07-06',
                    'start_date': '2054-07-02'
                }
            ]
        }
        self.event_two.save()

        self.serializer = EventSerializer(self.event)
        self.serializer_two = EventSerializer(self.event_two)

        self.event_three = copy(self.event)
        self.event_three.closed = True
        self.event_three.save()
        self.serializer_three = EventSerializer(self.event_three)

        self.event_four = copy(self.event_three)
        self.event_four.id = 'DBCRCON-1234'
        self.event_four.event_type = event_enums.EVENT_TYPE.ROAD_CONDITION
        self.event_four.closed = False
        self.event_four.save()
        self.serializer_four = EventSerializer(self.event_four)

        self.event_five = copy(self.event_four)
        self.event_five.id = 'DBC-1234'
        self.event_five.schedule = {
            "intervals": [
              "2025-05-23T14:00/2025-07-22T14:00"
            ]
        }

        self.event_five.start = datetime.datetime(
                2026, 6, 2, 16, 42, 16,
                tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver")
            )
        self.event_five.severity = event_enums.EVENT_SEVERITY.MINOR
        self.event_five.route_to = 'Test Ave'
        self.event_five.save()
        self.serializer_five = EventSerializer(self.event_five)

    def test_serializer_data(self):
        # First serializer
        # 2025/07/18 added 'area'
        assert len(self.serializer.data) == 29
        # route_from beings with 'at '
        assert self.serializer.data['route_display'] == \
               "Test Road to Test Avenue"
        assert self.serializer.data['direction_display'] == \
               "Northbound"
        assert self.serializer.data['schedule']['intervals'][0] == \
               "2023-05-23T14:00/2023-07-22T14:00"
        assert self.serializer.data['route_from'] == \
               "at Test Road"
        assert self.serializer.data['route_to'] == "Test Avenue"

        # Second serializer
        assert len(self.serializer_two.data) == 29
        # route_from doesn't being with 'at '
        assert self.serializer_two.data['route_display'] == \
               "Test Road Two to Test Avenue Two"
        assert self.serializer_two.data['direction_display'] == \
               "Both directions"
        # Eastern time auto adjusted to Pacific time
        assert self.serializer_two.data['last_updated'] == \
               '2023-06-02T13:42:16-07:00'
        # Manually set as future events via recurring schedule
        assert self.serializer_five.data['display_category'] == \
            'futureEvents'

        # Third serializer
        assert self.serializer_three.data['closed'] is True

        # Fourth serializer
        assert self.serializer_four.data['display_category'] == \
            'roadConditions'

        # Fifth serializer
        assert self.serializer_five.data['display_category'] == \
            'futureEvents'
        assert self.serializer_five.data['route_display'] == \
            'Test Road to Test Ave'
