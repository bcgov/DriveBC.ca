from unittest.mock import MagicMock
from django.test import TestCase
from apps.cms.serializers import EmergencyAlertSerializer

class EmergencyAlertSerializerTest(TestCase):

    def setUp(self):
        self.serializer = EmergencyAlertSerializer()

    def test_get_detail_url_returns_none_when_no_detail_page(self):
        obj = MagicMock()
        obj.detail_page = None

        result = self.serializer.get_detail_url(obj)

        self.assertIsNone(result)

    def test_get_detail_url_returns_none_when_detail_page_not_live(self):
        obj = MagicMock()
        obj.detail_page.live = False

        result = self.serializer.get_detail_url(obj)

        self.assertIsNone(result)

    def test_get_detail_url_returns_correct_url(self):
        obj = MagicMock()
        obj.detail_page.live = True
        obj.detail_page.specific.slug = "test-alert"

        with self.settings(FRONTEND_BASE_URL="https://drivebc.ca/"):
            result = self.serializer.get_detail_url(obj)

        self.assertEqual(result, "https://drivebc.ca/emergency-alert-detail/test-alert")

    def test_get_detail_url_with_different_slug(self):
        obj = MagicMock()
        obj.detail_page.live = True
        obj.detail_page.specific.slug = "highway-closure-alert"

        with self.settings(FRONTEND_BASE_URL="https://drivebc.ca/"):
            result = self.serializer.get_detail_url(obj)

        self.assertEqual(result, "https://drivebc.ca/emergency-alert-detail/highway-closure-alert")