import logging

from django.test import TestCase
from unittest.mock import MagicMock

from httpx import HTTPStatusError

from apps.webcam.models import Webcam

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
        super(BaseTest, cls).setUpClass()

    @classmethod
    def tearDownClass(cls):
        super(BaseTest, cls).tearDownClass()

    def setUp(self):
        super(BaseTest, self).setUp()

    def tearDown(self):
        super(BaseTest, self).tearDown()
        Webcam.objects.all().delete()
