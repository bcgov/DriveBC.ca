import json
import logging
from pathlib import Path
from unittest.mock import Mock, patch

from apps.dms.models import Dms
from apps.dms.tasks import populate_all_dms_data
from apps.shared.tests import BaseTest
from rest_framework.test import APIClient

# suppress logged error messages to reduce noise
logging.getLogger().setLevel(logging.CRITICAL)


class TestDmsPopulate(BaseTest):
    def setUp(self):
        self.client = APIClient()

        dms_list_of_one = open(
            str(Path(__file__).parent) +
            "/test_data/dms_list_of_three.json"
        )
        self.mock_dms_list_of_three = json.load(dms_list_of_one)
        dms_data_dms10 = open(
            str(Path(__file__).parent) +
            "/test_data/dms_data_dms10.json"
        )
        self.mock_dms_data_dms10 = json.load(dms_data_dms10)

    @patch('apps.dms.tasks.FeedClient')
    def test_populate_dms(self, mock_feed_client):
        mock_instance = Mock()
        mock_instance.get_dms_list.return_value = {'features': self.mock_dms_list_of_three}
        mock_feed_client.return_value = mock_instance

        populate_all_dms_data()

        assert Dms.objects.all().count() == 3
