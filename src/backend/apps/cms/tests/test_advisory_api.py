# import datetime
# import zoneinfo
from django.contrib.gis.geos import LineString
from django.contrib.contenttypes.models import ContentType

from apps.shared.tests import BaseTest
from rest_framework.test import APITestCase

from apps.cms.models import Advisory
from wagtail.models import Page
from apps.event.views import DelayAPI
from apps.shared.enums import CacheKey
from django.core.cache import cache


class TestAdvisoryAPI(APITestCase, BaseTest):
    def setUp(self):
        super().setUp()

        home_page = Page.objects.get(slug="home")
        print(home_page.title)
        print(home_page.path)

        root_page = Page.objects.get(slug="root")
        print(root_page.title)
        print(root_page.path)

        pages_queryset = Page.objects.all()
        # Convert the queryset to a list and get its length
        num_pages = len(list(pages_queryset))
        print(num_pages)
        # advisory = Advisory()

        advisory = Advisory.objects.create(
            # id=3,  
            advisory_title="Advisory title",
            advisory_description="Advisory description",
            advisory_active=True,
            advisory_geometry=LineString([(-119, 35), (-118, 32)]),
            title="Advisory title",
            path="000100010001",
            depth=3,
            content_type=ContentType.objects.get(app_label='cms', 
                                                 model='advisory'),
        )
        # home_page.add_child(instance=advisory)
        advisory.save()

        advisory_2 = Advisory.objects.create(
            # id=3,  
            advisory_title="Advisory title 2",
            advisory_description="Advisory description 2",
            advisory_active=True,
            advisory_geometry=LineString([(-119, 35), (-118, 32)]),
            title="Advisory title 2",
            path="000100010002",
            depth=3,
            content_type=ContentType.objects.get(app_label='cms', 
                                                 model='advisory'),
        )
        # home_page.add_child(instance=advisory)
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
        DelayAPI().set_list_data()
        response = self.client.get(url, {})
        assert len(response.data) == 0
        # pass
