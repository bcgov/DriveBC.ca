from apps.cms.models import Advisory
from apps.shared.tests import BaseTest
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import MultiPolygon, Polygon
from rest_framework.test import APITestCase


class TestAdvisoryAPI(APITestCase, BaseTest):
    def setUp(self):
        super().setUp()
        advisory = Advisory.objects.create(
            title="Advisory title",
            body='[{"id": "1", "type": "rich_text", "value": "Advisory body 1"}]',
            geometry=MultiPolygon(Polygon([(-119, 35), (-118, 32), (-117, 31), (-119, 35)])),
            path="000100010001",
            depth=3,
            content_type=ContentType.objects.get(
                app_label='cms',
                model='advisory'
            ),
        )
        advisory.save()

        advisory_2 = Advisory.objects.create(
            title="Advisory title 2",
            body='[{"id": "1", "type": "rich_text", "value": "Advisory body 2"}]',
            geometry=MultiPolygon(Polygon([
                (-119, 35),
                (-118, 32),
                (-117, 31),
                (-119, 35)
            ])),
            path="000100010002",
            depth=3,
            content_type=ContentType.objects.get(
                app_label='cms',
                model='advisory'
            ),
        )
        advisory_2.save()
