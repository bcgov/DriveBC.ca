from apps.cms.models import Ferry
from apps.cms.views import FerryAPI
from apps.shared.enums import CacheKey
from apps.shared.tests import BaseTest
from django.contrib.contenttypes.models import ContentType
from django.core.cache import cache
from rest_framework.test import APITestCase


class TestFerryAPI(APITestCase, BaseTest):
    def setUp(self):
        super().setUp()
        ferry = Ferry.objects.create(
            feed_id=1,
            title="Ferry title",
            path="000100010001",
            depth=3,
            content_type=ContentType.objects.get(
                app_label='cms',
                model='ferry'
            ),
            live=True,
        )
        ferry.save()

        ferry_2 = Ferry.objects.create(
            feed_id=2,
            title="Ferry title 2",
            path="000100010002",
            depth=3,
            content_type=ContentType.objects.get(
                app_label='cms',
                model='ferry'
            ),
            live=True,
        )
        ferry_2.save()

    def test_ferry_list_caching(self):
        # Empty cache
        assert cache.get(CacheKey.FERRY_LIST) is None

        # Build list of two cache on call
        url = "/api/cms/ferries/"
        response = self.client.get(url, {})
        assert len(response.data) == 2
        assert cache.get(CacheKey.FERRY_LIST) is not None

        # Cached result, still list of two after deletion
        Ferry.objects.first().delete()
        response = self.client.get(url, {})
        assert len(response.data) == 2

        # Updated cached result, only one row left
        FerryAPI().set_list_data()
        response = self.client.get(url, {})
        assert len(response.data) == 1
