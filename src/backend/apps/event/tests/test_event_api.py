import datetime
import zoneinfo
from unittest import skip

from apps.event import enums as event_enums
from apps.event.models import Event
from apps.event.views import EventAPI
from apps.shared.enums import CacheKey
from apps.shared.tests import BaseTest
from django.contrib.gis.geos import LineString, Point
from django.core.cache import cache
from rest_framework.test import APITestCase


class TestEventAPI(APITestCase, BaseTest):
    def setUp(self):
        super().setUp()

        for i in range(10):
            Event.objects.create(
                id=str(i),

                # Description
                description="Test description for test construction event",
                event_type=event_enums.EVENT_TYPE.CONSTRUCTION,
                event_sub_type=event_enums.EVENT_SUB_TYPE.ROAD_CONSTRUCTION,

                # General status
                status=event_enums.EVENT_STATUS.ACTIVE,
                severity=event_enums.EVENT_SEVERITY.MAJOR,

                # Location
                direction=event_enums.EVENT_DIRECTION.NORTH,
                # [-123.1071703, 49.2840563] 123 Water St, Vancouver, BC V6B 1A7
                location=Point(-123.1071703, 49.2840563),
                route_at="Test Highway",
                route_from="at Test Road",
                route_to="Test Avenue",

                # Update status
                first_created=datetime.datetime(
                    2023, 6, 2, 16, 42, 16,
                    tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver")
                ),
                last_updated=datetime.datetime(
                    2023, 6, 2, 16, 42, 16,
                    tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver")
                ),
                schedule={
                    "intervals": [
                        "2023-05-23T14:00/2023-07-22T14:00"
                    ]
                },
            )

    def test_delay_list_caching(self):
        # Empty cache
        assert cache.get(CacheKey.EVENT_LIST) is None

        # Cache miss
        url = "/api/events/"
        response = self.client.get(url, {})
        assert len(response.data) == 10
        assert cache.get(CacheKey.EVENT_LIST) is not None

        # Cached result
        Event.objects.filter(id__gte=5).delete()
        response = self.client.get(url, {})
        assert len(response.data) == 10

        # Updated cached result
        EventAPI().set_list_data()
        response = self.client.get(url, {})
        assert len(response.data) == 5

    @skip('to be mocked')
    def test_events_list_filtering(self):
        # No filtering
        url = "/api/events/"
        response = self.client.get(url, {})
        assert len(response.data) == 10

        # Manually update location of an event
        event = Event.objects.get(id=1)
        # [-123.077387, 49.209919] Beginning of Knight Bridge
        # [-123.077455, 49.19547] middle of Knight bridge
        event.location = LineString([
            Point(-123.077387, 49.209919),
            Point(-123.077455, 49.19547)
        ])
        event.save()

        # [-123.0803167, 49.2110127] 1306 SE Marine Dr, Vancouver, BC V5X 4K4
        # [-123.0824109, 49.1926452] 2780 Sweden Way, Richmond, BC V6V 2X1
        # Filtered cams - hit - point on knight bridge
        response = self.client.get(
            url, {'route': '-123.0803167,49.2110127,-123.0824109,49.1926452'}
        )
        assert len(response.data) == 1

        # [-123.0803167, 49.2110127] 1306 SE Marine Dr, Vancouver, BC V5X 4K4
        # [-123.0188764, 49.205069] 3864 Marine Wy, Burnaby, BC V5J 3H4
        # Filtered cams - miss - does not cross knight bridge
        response = self.client.get(
            url, {'route': '-123.0803167,49.2110127,-123.0188764,49.205069'}
        )
        assert len(response.data) == 0
