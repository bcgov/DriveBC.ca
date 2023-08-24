import datetime
import json
import os
import zoneinfo

from apps.event.enums import (
    EVENT_DIRECTION,
    EVENT_SEVERITY,
    EVENT_STATUS,
    EVENT_SUB_TYPE,
    EVENT_TYPE,
)
from apps.feed.serializers import EventAPISerializer
from apps.shared.tests import BaseTest


class TestEventFeedSerializer(BaseTest):
    def setUp(self):
        super().setUp()

        data_path = os.path.join(
            os.getcwd(),
            "apps/feed/tests/test_data/event_feed_list_of_one.json"
        )
        with open(data_path) as f:
            self.event_data = json.load(f)

    def test_event_to_internal_value(self):
        event_serializer = EventAPISerializer(data=self.event_data)
        event_serializer.is_valid(raise_exception=True)

        events_list = event_serializer.validated_data
        assert len(events_list["events"]) == 1

        event_data = events_list["events"][0]
        assert event_data["id"] == 'drivebc.ca/DBC-28386'

        # Description
        assert event_data["description"] == \
               'Quesnel-Hixon Road, in both directions. ' \
               'Landslide at Cottonwood bridge. Road closed. ' \
               'Next update time Wed Jul 12 at 2:00 PM PDT. ' \
               'Last updated Thu Apr 13 at 10:30 AM PDT. (DBC-28386)'
        assert event_data["event_type"] == EVENT_TYPE.INCIDENT
        assert event_data["event_sub_type"] == EVENT_SUB_TYPE.HAZARD

        # General status
        assert event_data["status"] == EVENT_STATUS.ACTIVE
        assert event_data["severity"] == EVENT_SEVERITY.MAJOR

        # Location
        assert event_data["direction"] == EVENT_DIRECTION.BOTH
        assert event_data["location"] == {'type': 'Point',
                                          'coordinates': [-122.479074, 53.155476]}
        assert event_data["route_at"] == 'Other Roads'
        assert event_data["route_from"] == 'at Cottonwood bridge'
        assert event_data["route_to"] == ''

        assert event_data["first_created"] == datetime.datetime(
            2021, 4, 26, 8, 19, 2, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver')
        )

        # Manually change year to future
        assert event_data["last_updated"].date() == datetime.date.today()
