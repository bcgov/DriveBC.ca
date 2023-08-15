import logging
from unittest.mock import MagicMock

from apps.event.models import Event
from apps.webcam.models import Webcam
from django.core.cache import cache
from django.test import TestCase
from httpx import HTTPStatusError

logger = logging.getLogger(__name__)


class MockResponse:
    def __init__(self, data, status_code, text='Mocked response text'):
        self.json = self.get_response(data)
        self.status_code = status_code
        self.text = text

    @staticmethod
    def get_response(data):
        mock = MagicMock()
        mock.return_value = data
        return mock

    def raise_for_status(self):
        raise HTTPStatusError('', request=None, response=self)


class BaseTest(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()

    def setUp(self):
        super().setUp()
        cache.clear()

    def tearDown(self):
        super().tearDown()
        cache.clear()
        Webcam.objects.all().delete()
        Event.objects.all().delete()
