import datetime
import json
import pprint
from django.test import TestCase
from unittest.mock import MagicMock, patch
from apps.webcam.tasks import update_cam_from_sql_db, update_webcam_db, create_webcam_db
from apps.webcam.enums import CAMERA_FIELD_MAPPING
from apps.webcam.tests.test_webcam_ordering import side_effect_populate
from apps.webcam.models import Webcam
from pathlib import Path
from unittest.mock import Mock

webcam_feed_data_1 = open(
            str(Path(__file__).parent) + "/test_data/webcam_feed_list_of_two.json"
        )
mock_webcam_feed_result_1 = json.load(webcam_feed_data_1)

def _make_existing_webcam(mock_populate, mock_webcam_feed):
    mock_populate.side_effect = lambda *args, **kwargs: side_effect_populate(mock_webcam_feed)
    from apps.webcam import tasks
    tasks.populate_all_webcam_data()

class TestUpdateCamFromSqlDb(TestCase):

    @patch("apps.webcam.tasks.populate_all_webcam_data")
    @patch("apps.webcam.tasks.update_webcam_db")
    @patch("apps.webcam.tasks.CameraSource")
    def test_cam_found_calls_update_webcam_db_and_returns_true(
        self, mock_camera_source, mock_update_webcam_db, mock_populate
    ):

        _make_existing_webcam(mock_populate, mock_webcam_feed_result_1)
        
        mock_cam = Webcam.objects.get(id=1)

        # Wire up the full ORM chain so .using("mssql") never hits the real DB
        (mock_camera_source.objects
            .using.return_value
            .filter.return_value
            .annotate.return_value
            .values.return_value
            .first.return_value) = mock_cam

        mock_update_webcam_db.return_value = 1

        result = update_cam_from_sql_db(id=1, current_time=datetime.datetime.now())

        self.assertTrue(result)
        mock_update_webcam_db.assert_called_once_with(1, mock_cam)
        mock_camera_source.objects.using.assert_called_once_with("mssql")

    @patch("apps.webcam.tasks.CameraSource")
    def test_orm_exception_returns_empty_dict(self, mock_camera_source):
        # Simulates a DB connection failure
        mock_camera_source.objects.using.side_effect = Exception("mssql unreachable")

        result = update_cam_from_sql_db(id=1, current_time=datetime.datetime.now())

        self.assertEqual(result, {})



class TestUpdateWebcamDb(TestCase):

    @patch("apps.webcam.tasks.populate_all_webcam_data")
    @patch("apps.webcam.tasks.calculate_camera_status")
    def test_webcam_not_found_returns_false(self, mock_calc_status, mock_populate):
        _make_existing_webcam(mock_populate, mock_webcam_feed_result_1)
        webcam = Webcam.objects.filter(id=1).first()

        mock_calc_status.return_value = {
            "timestamp": "1776852000",
            "mean_interval": 10,
            "stddev_interval": 2,
            "stale": False,
            "delayed": False,
        }

        camera_source_data = {
            "id": 1,
            "cam_internetname": "Test Cam",
            "cam_internetcaption": "Test Caption",
            "isOn": True,
            "should_appear": True,
            "isNew": 0,
            "isOnDemand": 0,
        }

        result = update_webcam_db(cam_id=1, cam_data=camera_source_data)
        webcam.refresh_from_db()
        self.assertEqual(webcam.name, "Test Cam")
        self.assertEqual(webcam.caption, "Test Caption")
        self.assertEqual(webcam.is_on, True)
        self.assertEqual(webcam.should_appear, True)
        self.assertEqual(result, True)

        result = update_webcam_db(cam_id=1, cam_data=camera_source_data)
        webcam.refresh_from_db()
        self.assertEqual(webcam.name, "Test Cam")
        self.assertEqual(webcam.caption, "Test Caption")
        self.assertEqual(webcam.is_on, True)
        self.assertEqual(webcam.should_appear, True)
        self.assertEqual(result, False)

        camera_source_data["cam_internetcaption"] = "Updated Caption"
        result = update_webcam_db(cam_id=1, cam_data=camera_source_data)
        webcam.refresh_from_db()
        self.assertEqual(webcam.caption, "Updated Caption")
        self.assertEqual(result, True)

        # Ensure DB has NO webcam
        Webcam.objects.all().delete()
        result = update_webcam_db(cam_id=1, cam_data=camera_source_data)
        self.assertEqual(result, False)

class TestCreateWebcamDb(TestCase):

    @patch("apps.webcam.tasks.populate_all_webcam_data")
    @patch("apps.webcam.tasks.calculate_camera_status")  
    @patch("apps.webcam.tasks.RegionHighway")
    @patch("apps.webcam.tasks.Region")
    @patch("apps.webcam.tasks.CameraSource")
    def test_create_webcam_db(self, mock_camera_source, mock_region, mock_region_highway, mock_calc_status, mock_populate):
        self.assertEqual(Webcam.objects.count(), 0)

        _make_existing_webcam(mock_populate, mock_webcam_feed_result_1)
        mock_cams = Webcam.objects.all()
        (mock_camera_source.objects
            .using.return_value
            .filter.return_value
            .annotate.return_value
            .values.return_value
            .first.return_value) = mock_cams

        cam_data = Mock()
        cam_data.id = 3
        cam_data.cam_internetname = "Test Cam New"
        cam_data.cam_internetcaption = "Test Caption"
        cam_data.cam_locationsregion = "Test Region"
        cam_data.cam_locationshighway = "Test Highway"
        cam_data.cam_locationsgeo_latitude = 49.2827
        cam_data.cam_locationsgeo_longitude = -123.1207
        cam_data.cam_controldisabled = 0
        cam_data.cam_controldisappear = 0
        cam_data.cam_internetdbc_mark = 0
        cam_data.cam_internetcredit = 0
        cam_data.cam_locationsorientation = "N"
        cam_data.cam_locationselevation = 100
        cam_data.cam_maintenanceis_on_demand = 0
        cam_data.isnew = 0
        cam_data.seq = 1

        mock_region.objects.using.return_value.filter.return_value.first.return_value = Mock(seq=1)
        mock_region_highway.objects.using.return_value.filter.return_value.first.return_value = Mock(seq=1)
        mock_calc_status.return_value = {
            "timestamp": "1710000000",
            "mean_interval": 10,
            "stddev_interval": 2,
            "stale": False,
            "delayed": False,
        }

        create_webcam_db(cam_data=cam_data)
        self.assertEqual(Webcam.objects.count(), 3)

        Webcam.objects.all().delete()

        create_webcam_db(cam_data=cam_data)
        self.assertEqual(Webcam.objects.count(), 1)
        self.assertEqual(Webcam.objects.first().name, "Test Cam New")