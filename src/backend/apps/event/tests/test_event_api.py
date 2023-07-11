import datetime
import zoneinfo

from apps.event import enums as event_enums
from apps.event.models import Event
from apps.shared.tests import BaseTest
from django.contrib.gis.geos import LineString
from rest_framework import status
from rest_framework.test import APITestCase


class TestEventAPI(APITestCase, BaseTest):
    def setUp(self):
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

    def test_event_list_pagination(self):
        url = "/api/events/"
        response = self.client.get(url, {})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 10

        package_with_no_offset = {
            "limit": 2,
            "offset": 0
        }
        no_offset_response = self.client.get(url, package_with_no_offset)
        assert no_offset_response.status_code == status.HTTP_200_OK
        assert len(no_offset_response.data["results"]) == 2

        package_with_offset = {
            "limit": 3,
            "offset": 2
        }
        offset_response = self.client.get(url, package_with_offset)
        assert offset_response.status_code == status.HTTP_200_OK
        assert len(offset_response.data["results"]) == 3
        assert offset_response.data["results"][0]["id"] == "2"
        assert offset_response.data["results"][1]["id"] == "3"
        assert offset_response.data["results"][2]["id"] == "4"
