import copy
import json
import logging
from pathlib import Path
from unittest.mock import MagicMock, patch

from apps.event.models import Event
from apps.event.ride import get_ride_event_dict
from apps.event.tasks import populate_all_event_data
from apps.shared.tests import BaseTest, MockResponse

logging.getLogger().setLevel(logging.CRITICAL)


def _ride_http_response(payload):
    m = MagicMock()
    m.json.return_value = payload
    m.status_code = 200
    return m


class TestGetRideEventDict(BaseTest):
    def test_returns_dict_indexed_by_id(self):
        payload = [
            {
                "id": "RIDE-A",
                "impacts": [{"closed": True}],
                "location": {
                    "start": {
                        "name": "Highway 1",
                        "nearby": [],
                    }
                },
                "segment": {"name": "Seg 1"},
                "timings": {},
                "route_projection": 1.0,
            }
        ]
        with patch("apps.event.ride.requests.get", return_value=_ride_http_response(payload)):
            result = get_ride_event_dict()

        assert set(result.keys()) == {"RIDE-A"}
        assert result["RIDE-A"]["closed"] is True
        assert result["RIDE-A"]["route_at"] == "Highway 1"
        assert result["RIDE-A"]["highway_segment_names"] == "Seg 1"

    def test_invalid_payload_returns_empty_dict(self):
        # Unparseable nextUpdate fails RIDEEventSerializer; ride module logs and returns {}
        bad = [
            {
                "id": "RIDE-BAD",
                "impacts": [],
                "location": {},
                "segment": None,
                "timings": {"nextUpdate": "not-a-datetime"},
                "route_projection": 0,
            }
        ]
        with patch("apps.event.ride.requests.get", return_value=_ride_http_response(bad)):
            assert get_ride_event_dict() == {}


class TestPopulateRideMerge(BaseTest):
    """populate_all_event_data uses ride_events for RIDE-* Open511 ids."""

    def setUp(self):
        super().setUp()
        data_dir = Path(__file__).parent / "test_data"
        with open(data_dir / "event_feed_list_of_five.json") as f:
            self._feed_template = json.load(f)

    def _ride_open511_event(self):
        ev = copy.deepcopy(self._feed_template["events"][0])
        ev["id"] = "drivebc.ca/RIDE-TEST1"
        ev["url"] = "https://api.open511.gov.bc.ca/events/drivebc.ca/RIDE-TEST1"
        ev["description"] = (
            "Test RIDE event. Last updated Thu Apr 13 at 10:30 AM PDT. (RIDE-TEST1)"
        )
        return {"events": [ev]}

    @patch("apps.event.ride.requests.get")
    @patch("httpx.get")
    def test_ride_uses_ride_feed_not_dit(self, mock_httpx_get, mock_requests_get):
        open511 = self._ride_open511_event()
        mock_httpx_get.side_effect = [
            MockResponse(open511, status_code=200),
            MockResponse([], status_code=200),
        ]
        ride_payload = [
            {
                "id": "RIDE-TEST1",
                "impacts": [{"closed": True}],
                "location": {
                    "start": {
                        "name": "From RIDE feed",
                        "nearby": [],
                    }
                },
                "segment": None,
                "timings": {},
                "route_projection": 0,
            }
        ]
        mock_requests_get.return_value = _ride_http_response(ride_payload)

        populate_all_event_data()

        event = Event.objects.get(id="RIDE-TEST1")
        assert event.closed is True
        assert event.route_at == "From RIDE feed"
