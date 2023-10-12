from apps.cms.models import Advisory
from apps.event.views import EventAPI
from apps.shared.enums import CacheKey
from apps.shared.tests import BaseTest
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import LineString
from django.core.cache import cache
from rest_framework.test import APITestCase


class TestAdvisoryAPI(APITestCase, BaseTest):
    def setUp(self):
        super().setUp()
        advisory = Advisory.objects.create(
            title="Advisory title",
            description="Advisory description",
            active=True,
            geometry=LineString([(-119, 35), (-118, 32)]),
            path="000100010001",
            depth=3,
            content_type=ContentType.objects.get(app_label='cms',
                                                 model='advisory'),
        )
        advisory.save()

        advisory_2 = Advisory.objects.create(
            title="Advisory title 2",
            description="Advisory description 2",
            active=True,
            geometry=LineString([(-119, 35), (-118, 32)]),
            path="000100010002",
            depth=3,
            content_type=ContentType.objects.get(app_label='cms',
                                                 model='advisory'),
        )
        advisory_2.save()

    def test_advisory_list_caching(self):
        # Empty cache
        assert cache.get(CacheKey.DELAY_LIST) is None

        # Cache miss
        url = "/api/cms/advisories/"
        response = self.client.get(url, {})
        assert len(response.data) == 2
        assert cache.get(CacheKey.DELAY_LIST) is None

        # Cached result
        Advisory.objects.filter(id__gte=2).delete()
        response = self.client.get(url, {})
        assert len(response.data) == 0

        # Updated cached result
        EventAPI().set_list_data()
        response = self.client.get(url, {})
        assert len(response.data) == 0
