import os
from io import BytesIO

from apps.cms.models import Bulletin
from apps.cms.views import BulletinTestAPI
from apps.shared.enums import CacheKey
from apps.shared.tests import BaseTest
from django.contrib.contenttypes.models import ContentType
from django.core.cache import cache
from django.core.files.images import ImageFile
from rest_framework.test import APITestCase
from wagtail.images.models import Image


class TestBulletinAPI(APITestCase, BaseTest):
    def setUp(self):
        super().setUp()

        # Programatically create wagtail image file
        img_directory = os.path.dirname(__file__)
        filename = 'testimg.png'
        path = f"{img_directory}/{filename}"
        img_bytes = open(path, "rb").read()
        img_file = ImageFile(BytesIO(img_bytes), name=filename)

        img_obj = Image(title=filename, file=img_file, width=165, height=51)
        img_obj.save()

        bulletin = Bulletin.objects.create(
            title="Bulletin title",
            body='[{"id": "1", "type": "rich_text", "value": "Bulletin body 1"}]',
            path="000100010001",
            depth=3,
            image=img_obj,
            image_alt_text='Some Image Alt text',
            content_type=ContentType.objects.get(
                app_label='cms',
                model='bulletin'
            ),
        )
        bulletin.save()

        bulletin_2 = Bulletin.objects.create(
            title="Bulletin title 2",
            body='[{"id": "1", "type": "rich_text", "value": "Bulletin body 1"}]',
            path="000100010002",
            depth=3,
            image=img_obj,
            image_alt_text='Some Image Alt text',
            content_type=ContentType.objects.get(
                app_label='cms',
                model='bulletin'
            ),
        )
        bulletin_2.save()

    def test_bulletin_list_caching(self):
        # Empty cache
        assert cache.get(CacheKey.BULLETIN_LIST) is None

        # Cache miss
        url = "/api/cms/bulletins/"
        response = self.client.get(url, {})
        assert len(response.data) == 2
        assert cache.get(CacheKey.BULLETIN_LIST) is not None

        # Cached result
        Bulletin.objects.first().delete()
        response = self.client.get(url, {})
        assert len(response.data) == 2

        # Updated cached result
        BulletinTestAPI().set_list_data()  # Use serializer without method fields
        response = self.client.get(url, {})
        assert len(response.data) == 1
