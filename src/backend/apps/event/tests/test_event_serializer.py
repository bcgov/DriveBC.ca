import datetime
import zoneinfo

from apps.event import enums as event_enums
from apps.event.models import Event
from apps.event.serializers import EventSerializer
from apps.shared.tests import BaseTest
from django.contrib.gis.geos import LineString


class TestEventSerializer(BaseTest):
    def setUp(self):
        self.event = Event.objects.create(
            id="1",

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
            route="Test route at test intersection",

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
        self.serializer = EventSerializer(self.event)

    def test_serializer_data(self):
        assert len(self.serializer.data) == 11
