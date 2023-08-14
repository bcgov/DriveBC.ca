import datetime
import zoneinfo

from apps.event import enums as event_enums
from apps.event.models import Event
from apps.event.views import DelayAPI
from apps.shared.enums import CacheKey
from apps.shared.tests import BaseTest
from django.contrib.gis.geos import LineString
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
                location=LineString([(-123.569743, 48.561231),
                                     (-123.569743, 48.561231)]),

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
            )

    def test_delay_list_caching(self):
        # Empty cache
        assert cache.get(CacheKey.DELAY_LIST) is None

        # Cache miss
        url = "/api/events/"
        response = self.client.get(url, {})
        assert len(response.data) == 10
        assert cache.get(CacheKey.DELAY_LIST) is not None

        # Cached result
        Event.objects.filter(id__gte=5).delete()
        response = self.client.get(url, {})
        assert len(response.data) == 10

        # Updated cached result
        DelayAPI().set_list_data()
        response = self.client.get(url, {})
        assert len(response.data) == 5
