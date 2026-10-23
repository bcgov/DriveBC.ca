import copy
import datetime
import logging
import zoneinfo
from unittest.mock import MagicMock, patch

from apps.event.enums import EVENT_DIRECTION, EVENT_SUB_TYPE, EVENT_TYPE
from apps.event.models import Event
from apps.event.ride import get_ride_events
from apps.event.tasks import populate_all_event_data
from apps.shared.tests import BaseTest

logging.getLogger().setLevel(logging.CRITICAL)

RIDE_EVENT = {
    "id": "RIDE-A",
    "type": "Incident",
    "status": "Active",
    "latest_approved": True,
    "description": "Highway 1 eastbound. Vehicle incident.",
    "created": "2026-10-01T17:00:00Z",
    "last_updated": "2026-10-01T18:00:00.123456Z",
    "details": {"direction": "Eastbound", "severity": "Major", "situation": 160},
    "impacts": [{"closed": True}],
    "location": {
        "start": {
            "name": "Highway 1",
            "alias": "Trans-Canada Hwy",
            "ROAD_NAME_FULL": "Trans-Canada Hwy",
            "nearby": [],
            "coords": [-123.1, 49.2],
        },
    },
    "geometry": {
        "type": "GeometryCollection",
        "geometries": [
            {"type": "Point", "coordinates": [-123.1, 49.2]},
            {"type": "LineString", "coordinates": [[-123.1, 49.2], [-123.0, 49.3]]},
        ],
    },
    "segment": None,
    "timing": {"startTime": "2026-10-01T16:00:00Z", "endTime": None, "nextUpdate": None},
    "route_projection": 1.5,
}


def ride_event(**overrides):
    return {**copy.deepcopy(RIDE_EVENT), **overrides}


def ride_http_response(payload):
    m = MagicMock()
    m.json.return_value = payload
    m.status_code = 200
    return m


class TestGetRideEvents(BaseTest):
    def get_events(self, payload):
        with patch("apps.event.ride.requests.get", return_value=ride_http_response(payload)) as mock_get:
            events = get_ride_events()

        assert mock_get.call_args[0][0].endswith("/relevant")
        return events

    def test_maps_open511_fields(self):
        events = self.get_events([ride_event()])

        assert len(events) == 1
        event = events[0]
        assert event["id"] == "RIDE-A"
        assert event["description"] == "Highway 1 eastbound. Vehicle incident."
        assert event["event_type"] == EVENT_TYPE.INCIDENT
        assert event["event_sub_type"] == EVENT_SUB_TYPE.HAZARD
        assert event["status"] == "ACTIVE"
        assert event["severity"] == "MAJOR"
        assert event["direction"] == EVENT_DIRECTION.EAST
        assert event["closed"] is True
        assert event["location"]["type"] == "LineString"
        assert event["route_at"] == "Highway 1, Trans-Canada Hwy"
        assert event["route_from"] == "Trans-Canada Hwy"
        assert event["route_to"] == ""
        assert event["last_updated"] == datetime.datetime(2026, 10, 1, 18, tzinfo=datetime.timezone.utc)
        assert event["start"] == datetime.datetime(2026, 10, 1, 16, tzinfo=datetime.timezone.utc)
        assert event["end"] is None
        assert event["schedule"] == {"intervals": ["2026-10-01T09:00:00-07:00/"]}
        assert event["start_point_linear_reference"] == 1.5
        assert event["timezone"] == "America/Vancouver"

    def test_route_at_skips_highway_number_alias(self):
        data = ride_event()
        data["location"]["start"]["alias"] = "Highway 1 And 95"

        assert self.get_events([data])[0]["route_at"] == "Highway 1"

    def test_skips_unapproved_and_inactive_versions(self):
        events = self.get_events([
            ride_event(id="RIDE-PENDING", latest_approved=False),
            ride_event(id="RIDE-INACTIVE", status="Inactive"),
            ride_event(id="RIDE-OK"),
        ])

        assert [e["id"] for e in events] == ["RIDE-OK"]

    def test_planned_event_sub_type(self):
        # Matched situation wins; PLANNED_EVENT only when unmatched
        events = self.get_events([
            ride_event(id="RIDE-1", type="Planned event", details={"situation": 12}),
            ride_event(id="RIDE-2", type="Planned event", details={"situation": 0}),
        ])

        assert [e["event_type"] for e in events] == [EVENT_TYPE.CONSTRUCTION] * 2
        assert [e["event_sub_type"] for e in events] == [
            EVENT_SUB_TYPE.ROAD_CONSTRUCTION, EVENT_SUB_TYPE.PLANNED_EVENT
        ]

    def test_road_condition_defaults(self):
        events = self.get_events([ride_event(
            type="ROAD_CONDITION",
            details={},
            location={"start": {"name": "Hwy 18 - Paldi Rd to Tansor Rd"}},
            segment={"name": "Hwy 18 - Paldi Rd to Tansor Rd", "description": "Highway 18, between Paldi Rd"},
            timing={},
        )])

        event = events[0]
        assert event["event_type"] == EVENT_TYPE.ROAD_CONDITION
        assert event["severity"] == "MINOR"
        assert event["direction"] == EVENT_DIRECTION.BOTH
        assert event["route_at"] == "Highway 18"
        assert event["route_from"] == "Highway 18"
        assert event["start"] == datetime.datetime(2026, 10, 1, 17, tzinfo=datetime.timezone.utc)

    def test_invalid_payload_skipped(self):
        # Unparseable nextUpdate fails RIDEEventSerializer
        events = self.get_events([
            ride_event(id="RIDE-BAD", timing={"nextUpdate": "not-a-datetime"}),
        ])

        assert events == []


class TestPopulateRideEvents(BaseTest):
    @patch("apps.event.ride.requests.get")
    def test_populates_from_ride(self, mock_requests_get):
        mock_requests_get.return_value = ride_http_response([ride_event()])

        populate_all_event_data()

        event = Event.objects.get(id="RIDE-A")
        assert event.closed is True
        assert event.route_at == "Highway 1, Trans-Canada Hwy"
        assert event.description == "Highway 1 eastbound. Vehicle incident."
        assert event.severity == "MAJOR"
        assert event.first_created == datetime.datetime(
            2026, 10, 1, 10, tzinfo=zoneinfo.ZoneInfo("America/Vancouver")
        )
