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
from apps.feed.serializers import CarsClosureEventSerializer, EventAPISerializer
from apps.shared.tests import BaseTest


class TestEventFeedSerializer(BaseTest):
    def setUp(self):
        super().setUp()

        data_path = os.path.join(
            os.getcwd(),
            # "src/backend/apps/feed/tests/test_data/event_feed_list_of_two.json"
            "apps/feed/tests/test_data/event_feed_list_of_two.json"
        )
        with open(data_path) as f:
            self.event_data = json.load(f)

    def test_event_to_internal_value(self):
        event_serializer = EventAPISerializer(data=self.event_data)
        event_serializer.is_valid(raise_exception=True)

        events_list = event_serializer.validated_data
        assert len(events_list["events"]) == 2

        first_event_data = events_list["events"][0]
        assert first_event_data["id"] == 'drivebc.ca/DBC-28386'

        # Description
        assert first_event_data["description"] == \
               'Quesnel-Hixon Road, in both directions. ' \
               'Landslide at Cottonwood bridge. Road closed. ' \
               'Next update time Wed Jul 12 at 2:00 PM PDT. ' \
               'Last updated Thu Apr 13 at 10:30 AM PDT. (DBC-28386)'
        assert first_event_data["event_type"] == EVENT_TYPE.INCIDENT
        assert first_event_data["event_sub_type"] == EVENT_SUB_TYPE.HAZARD

        # General status
        assert first_event_data["status"] == EVENT_STATUS.ACTIVE
        assert first_event_data["severity"] == EVENT_SEVERITY.MAJOR

        # Location
        assert first_event_data["direction"] == EVENT_DIRECTION.BOTH
        assert first_event_data["location"] == {
            'type': 'Point',
            'coordinates': [-122.479074, 53.155476]
        }
        assert first_event_data["route_at"] == 'Other Roads'
        assert first_event_data["route_from"] == 'at Cottonwood bridge'
        assert first_event_data["route_to"] == ''

        # Manually changed timezone to Eastern
        assert first_event_data["first_created"] == datetime.datetime(
            2021, 4, 26, 5, 19, 2, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver')
        )

        # Manually changed year to future
        assert first_event_data["last_updated"].date() == datetime.date.today()

        second_event_data = events_list["events"][1]
        assert ("event_sub_type" not in second_event_data) is True

        # assert first_event_data["start"] == datetime.strptime("2021-04-26T15:19", "%Y-%m-%dT%H:%M")

        

    def test_cars_closure_event_to_internal_value(self):
        cars_closure_event_1 = {
            'event-id': 111,
            'details': [
                {
                    'category': 'test-category',
                    'code': 'test-code',
                }
            ],
            'closed': True
        }
        cars_closure_event_serializer_1 = CarsClosureEventSerializer(data=cars_closure_event_1)
        cars_closure_event_serializer_1.is_valid(raise_exception=True)

        cars_closure_event_2 = {
            'event-id': 222,
            'details': [
                {
                    'category': 'traffic_pattern',
                    'code': 'closed test-code',
                    'descriptions': [{"kind": {'category': 'traffic_pattern', 'code': 'closed'}} ]
                },
                {
                    'category': 'traffic_pattern',
                    'code': 'test-code',
                    'descriptions': [{"kind": {'category': 'traffic_pattern', 'code': 'closed'}} ]
                }
            ],
            'closed': False
        }
        cars_closure_event_serializer_2 = CarsClosureEventSerializer(data=cars_closure_event_2)
        cars_closure_event_serializer_2.is_valid(raise_exception=True)
        assert cars_closure_event_1["id"] == 111
        assert cars_closure_event_2["id"] == 222
