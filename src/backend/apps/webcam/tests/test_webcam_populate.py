import datetime
import json
import logging
from http.client import INTERNAL_SERVER_ERROR
from pathlib import Path
from unittest.mock import MagicMock, patch
from apps.shared.tests import BaseTest, MockResponse
from apps.webcam.models import Webcam
from apps.webcam.tests.test_data.webcam_parsed_feed import parsed_feed
from django.contrib.gis.geos import Point
from apps.webcam.tests.test_webcam_ordering import side_effect_populate
from django.core.exceptions import ObjectDoesNotExist
from apps.webcam.tasks import populate_webcam_from_data
from apps.webcam.tasks import update_webcam_db_stale_delayed, update_cam_from_sql_db

# suppress logged error messages to reduce noise
logging.getLogger().setLevel(logging.CRITICAL)


class TestWebcamModel(BaseTest):
    webcam_feed_data_1 = open(
            str(Path(__file__).parent) + "/test_data/webcam_feed_list_of_two.json"
        )
    mock_webcam_feed_result_1 = json.load(webcam_feed_data_1)

    webcam_feed_data_2 = open(
    str(Path(__file__).parent) + "/test_data/webcam_feed_list_of_two_with_errors.json"
    )
    mock_webcam_feed_result_2 = json.load(webcam_feed_data_2)

    def setUp(self):
        super().setUp()

        # Normal feed
        webcam_feed_data = open(
            str(Path(__file__).parent) + "/test_data/webcam_feed_list_of_five.json"
        )
        self.mock_webcam_feed_result = json.load(webcam_feed_data)

        # Feed with error in data
        webcam_feed_data_with_errors = open(
            str(Path(__file__).parent)
            + "/test_data/webcam_feed_list_of_five_with_validation_error.json"
        )
        self.mock_webcam_feed_result_with_errors = json.load(
            webcam_feed_data_with_errors
        )

        # Parsed python dict
        self.parsed_feed = parsed_feed

    @patch("apps.webcam.tasks.populate_all_webcam_data")
    def test_populate_webcam_function(self, mock_populate):
        mock_populate.side_effect = lambda *args, **kwargs: side_effect_populate(self.mock_webcam_feed_result_1)
        from apps.webcam import tasks
        tasks.populate_all_webcam_data()
        webcam_one = Webcam.objects.get(id=1)

        # Description
        assert webcam_one.name == "Coquihalla Great Bear Snowshed - N"
        assert webcam_one.caption == "Hwy 5, Great Bear Snowshed looking north."

        # Location
        assert webcam_one.location.equals(Point(-121.159832, 49.596374)) is True
        assert webcam_one.elevation == 980
        assert webcam_one.orientation == "N"
        assert webcam_one.region == 1
        assert webcam_one.region_name == "Vancouver Island"
        assert webcam_one.highway == "1"
        assert webcam_one.highway_group == 1
        assert webcam_one.highway_description == "Vancouver Island"

        # General status
        assert webcam_one.is_on is True
        assert webcam_one.should_appear is True
        assert webcam_one.is_new is False
        assert webcam_one.is_on_demand is False

        # Update status
        assert webcam_one.marked_stale is False
        assert webcam_one.marked_delayed is False
        assert webcam_one.last_update_attempt == datetime.datetime(
            2024, 1, 1, 0, 0, 0, tzinfo=datetime.timezone.utc
        )
        assert webcam_one.last_update_modified == datetime.datetime(
            2024, 1, 1, 0, 0, 0, tzinfo=datetime.timezone.utc
        )
        assert webcam_one.update_period_mean == 899
        assert webcam_one.update_period_stddev == 12

    @patch("apps.webcam.tasks.populate_all_webcam_data")
    @patch("httpx.get")
    def test_populate_webcam(self, mock_requests_get, mock_populate):
        mock_requests_get.side_effect = [
            MockResponse(self.mock_webcam_feed_result, status_code=200),
        ]

        mock_populate.side_effect = lambda *args, **kwargs: side_effect_populate(self.mock_webcam_feed_result_1)

        from apps.webcam import tasks
        tasks.populate_all_webcam_data()

        assert Webcam.objects.count() == 2

        webcam_id_list = sorted(Webcam.objects.all().values_list("id", flat=True))
        assert webcam_id_list == [1, 2]

        webcam_one = Webcam.objects.get(id=1)
        assert webcam_one.last_update_attempt == datetime.datetime(2024, 1, 1, 0, 0, 0, tzinfo=datetime.timezone.utc)
        assert webcam_one.last_update_modified == datetime.datetime(2024, 1, 1, 0, 0, 0, tzinfo=datetime.timezone.utc)

        webcam_two = Webcam.objects.get(id=2)
        assert webcam_two.highway_description == ""
        assert webcam_two.orientation == "N"

    @patch("apps.webcam.tasks.populate_all_webcam_data")
    def test_populate_webcam_with_validation_error(self, mock_populate):
        mock_populate.side_effect = lambda *args, **kwargs: side_effect_populate(self.mock_webcam_feed_result_2)
        from apps.webcam import tasks
        tasks.populate_all_webcam_data()
        assert Webcam.objects.count() == 2

        webcam_id_list = sorted(Webcam.objects.all().values_list("id", flat=True))
        assert webcam_id_list == [1, 2]

    @patch("apps.webcam.tasks.populate_all_webcam_data")
    def test_populate_webcam_from_data_success(self, mock_populate):
        fake_data = MagicMock()
        fake_data.id = 1

        with patch("apps.webcam.tasks.create_webcam_db") as mock_create:
            mock_create.return_value = (None, False)

            populate_webcam_from_data(fake_data)

            mock_create.assert_called_once_with(fake_data)

    def test_populate_webcam_from_data_exception(self):
        fake_data = MagicMock()
        fake_data.id = 999

        with patch("apps.webcam.tasks.create_webcam_db") as mock_create, \
            patch("apps.webcam.tasks.logger") as mock_logger:

            mock_create.side_effect = ObjectDoesNotExist()

            populate_webcam_from_data(fake_data)

            mock_logger.error.assert_called_once()

    @patch("apps.webcam.tasks.populate_all_webcam_data")
    def test_update_webcam_db_stale_delayed(self, mock_populate):
        mock_populate.side_effect = lambda *args, **kwargs: side_effect_populate(self.mock_webcam_feed_result_2)
        from apps.webcam import tasks
        tasks.populate_all_webcam_data()

        # Call the function
        webcam = Webcam.objects.first()
        update_webcam_db_stale_delayed(webcam)

        # Refresh from DB
        webcam.refresh_from_db()

        # Assertions
        self.assertFalse(webcam.marked_stale)
        self.assertFalse(webcam.marked_delayed)
        self.assertIsInstance(webcam.last_update_attempt, datetime.datetime)
        self.assertIsInstance(webcam.last_update_modified, datetime.datetime)
