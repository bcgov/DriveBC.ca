from apps.cms.models import Bulletin
from apps.event.views import EventAPI
from apps.shared.enums import CacheKey
from apps.shared.tests import BaseTest
from django.contrib.contenttypes.models import ContentType
from django.core.cache import cache
from rest_framework.test import APITestCase


class TestBulletinAPI(APITestCase, BaseTest):
    def setUp(self):
        super().setUp()
        bulletin = Bulletin.objects.create(
            title="Bulletin title",
            description="Bulletin description",
            active=True,
            path="000100010001",
            depth=3,
            content_type=ContentType.objects.get(app_label='cms',
                                                 model='bulletin'),
        )
        bulletin.save()

        bulletin_2 = Bulletin.objects.create(
            title="Bulletin title 2",
            description="Bulletin description 2",
            active=True,
            path="000100010002",
            depth=3,
            content_type=ContentType.objects.get(app_label='cms',
                                                 model='bulletin'),
        )
        bulletin_2.save()

    def test_bulletin_list_caching(self):
        # Empty cache
        assert cache.get(CacheKey.DELAY_LIST) is None

        # Cache miss
        url = "/api/cms/bulletins/"
        response = self.client.get(url, {})
        assert len(response.data) == 2
        assert cache.get(CacheKey.DELAY_LIST) is None

        # Cached result
        Bulletin.objects.filter(id__gte=2).delete()
        response = self.client.get(url, {})
        assert len(response.data) == 0

        # Updated cached result
        EventAPI().set_list_data()
        response = self.client.get(url, {})
        assert len(response.data) == 0
