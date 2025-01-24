from apps.cms.models import Advisory
from apps.cms.views import AdvisoryAPI
from apps.shared.enums import CacheKey
from apps.shared.tests import BaseTest
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import MultiPolygon, Polygon
from django.core.cache import cache
from rest_framework.test import APITestCase


class TestAdvisoryAPI(APITestCase, BaseTest):
    def setUp(self):
        super().setUp()
        advisory = Advisory.objects.create(
            title = "Advisory title",
            body = '[{"id": "1", "type": "rich_text", "value": "Advisory body 1"}]',
            geometry = MultiPolygon(Polygon([(-119, 35), (-118, 32), (-117, 31), (-119, 35)])),
            path = "000100010001",
            depth = 3,
            content_type = ContentType.objects.get(app_label='cms',
                                                   model='advisory'),
        )
        advisory.save()

        advisory_2 = Advisory.objects.create(
            title = "Advisory title 2",
            body = '[{"id": "1", "type": "rich_text", "value": "Advisory body 2"}]',
            geometry = MultiPolygon(Polygon([
                (-119, 35),
                (-118, 32),
                (-117, 31),
                (-119, 35)
            ])),
            path = "000100010002",
            depth = 3,
            content_type = ContentType.objects.get(app_label='cms',
                                                   model='advisory'),
        )
        advisory_2.save()

    # def test_advisory_list_caching(self):
    #     # Empty cache
    #     assert cache.get(CacheKey.ADVISORY_LIST) is None

    #     # Cache miss
    #     url = "/api/cms/advisories/"
    #     response = self.client.get(url, {})
    #     assert len(response.data) == 2
    #     assert cache.get(CacheKey.ADVISORY_LIST) is not None

    #     # Cached result
    #     Advisory.objects.first().delete()
    #     response = self.client.get(url, {})
    #     assert len(response.data) == 2

    #     # Updated cached result
    #     AdvisoryAPI().set_list_data()
    #     response = self.client.get(url, {})
    #     assert len(response.data) == 1
