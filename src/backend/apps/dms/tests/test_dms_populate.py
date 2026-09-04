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

        test_data_path = Path(__file__).parent / "test_data"
        with open(test_data_path / "signs.json") as signs_file:
            self.mock_signs = json.load(signs_file)
        with open(test_data_path / "statuses.json") as statuses_file:
            self.mock_statuses = json.load(statuses_file)

    @patch('apps.dms.tasks.FeedClient')
    def test_populate_dms(self, mock_feed_client):
        mock_instance = Mock()
        mock_instance.get_dms_list.return_value = {
            'signs': self.mock_signs,
            'statuses': self.mock_statuses,
        }
        mock_feed_client.return_value = mock_instance

        populate_all_dms_data()

        assert Dms.objects.all().count() == len(self.mock_signs)
        assert Dms.objects.get(id='1').roadway_direction == 'Westbound'
        assert Dms.objects.get(id='1').message_text.startswith('[pt25o0]')
        assert Dms.objects.get(id='2').roadway_name == 'Highway 5 South'
        assert Dms.objects.get(id='5').status == 'Device Error'
        assert Dms.objects.get(id='5').is_on is True
