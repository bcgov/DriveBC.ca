import json
from pathlib import Path
from unittest.mock import patch

from apps.cms.models import Ferry
from apps.cms.tasks import populate_all_ferry_data, populate_ferry_from_data
from apps.cms.tests.test_data.ferry_parsed_feed import parsed_feed
from apps.shared.tests import BaseTest, MockResponse


class TestFerryFeed(BaseTest):
    def setUp(self):
        super().setUp()

        # Normal feed
        ferry_feed = open(
            str(Path(__file__).parent) + "/test_data/ferry_feed.json"
        )
        self.mock_ferry_feed_result = json.load(ferry_feed)

        # Parsed python dict
        self.parsed_feed = parsed_feed

    def test_populate_ferry_function(self):
        populate_ferry_from_data(parsed_feed)

        ferry = Ferry.objects.get(feed_id=15)
        assert ferry.title == 'Barnston Island Ferry'

    @patch("httpx.get")
    def test_populate_ferry(self, mock_requests_get):
        mock_requests_get.side_effect = [
            MockResponse(self.mock_ferry_feed_result, status_code=200),
        ]

        populate_all_ferry_data()
        assert Ferry.objects.count() == 14
