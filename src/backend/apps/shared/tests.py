import logging

from django.test import TestCase

logger = logging.getLogger(__name__)


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
