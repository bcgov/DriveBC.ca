from unittest.mock import patch, MagicMock
from datetime import datetime

from django.test import TestCase
from django.core.cache import cache

from apps.consumer.tasks import generate_offline_camera_images
from apps.webcam.models import Webcam


class TestGenerateOfflineCameraImages(TestCase):
    def setUp(self):
        super().setUp()
        cache.clear()

    def tearDown(self):
        super().tearDown()
        cache.clear()
        Webcam.objects.all().delete()

    @patch('apps.consumer.tasks.check_backup_exists')
    @patch('apps.consumer.tasks.get_all_from_db')
    @patch('apps.consumer.tasks.process_camera_rows')
    def test_generates_for_offline_cameras(
        self,
        mock_process_rows,
        mock_get_db,
        mock_check_backup_exists,
    ):
        mock_get_db.return_value = []
        mock_process_rows.return_value = [
            {'id': 1, 'is_on': False, 'cam_internet_name': 'Camera 1'},
        ]
        mock_check_backup_exists.return_value = False

        with patch('apps.consumer.tasks.delete_watermarked_image_from_pvc'), \
            patch('apps.consumer.tasks.save_watermarked_image_to_drivebc_pvc') as mock_save_drivebc:

            generate_offline_camera_images()

            mock_save_drivebc.assert_not_called()

    @patch("apps.consumer.tasks.save_watermarked_image_to_drivebc_pvc")
    @patch("apps.consumer.tasks.check_backup_exists")
    @patch("apps.consumer.tasks.delete_offline_webcam_records")
    @patch("apps.consumer.tasks.delete_watermarked_image_from_pvc")
    @patch("apps.consumer.tasks.blank_out_image")
    @patch("apps.consumer.tasks.Webcam")
    @patch("apps.consumer.tasks.process_camera_rows")
    @patch("apps.consumer.tasks.get_all_from_db")
    def test_generate_offline_camera_images_saves_blank_image(
        self,
        mock_get_all_from_db,
        mock_process_camera_rows,
        mock_webcam,
        mock_blank_out_image,
        mock_delete_watermarked,
        mock_delete_records,
        mock_check_backup_exists,
        mock_save_image,
    ):

        camera = {
            "id": 1001,
            "is_on": False,
            "message": {
                "long": "Camera offline"
            },
            "dbc_mark": "DriveBC",
        }

        # DB source data
        mock_get_all_from_db.return_value = ["row"]

        # Processed camera list
        mock_process_camera_rows.return_value = [camera]

        # Webcam exists in Postgres
        mock_webcam.filter.return_value.exists.return_value = True

        # blank_out_image returns generated image bytes
        mock_blank_out_image.return_value = b"fake image bytes"

        # No backup image exists, so save should happen
        mock_check_backup_exists.return_value = False

        generate_offline_camera_images()

        # Verify offline branch executed
        mock_blank_out_image.assert_called_once()

        # Verify old images removed
        mock_delete_watermarked.assert_called_once_with("1001")

        # Verify old DB records removed
        mock_delete_records.assert_called_once_with("1001")

        # Verify new blank image saved
        mock_save_image.assert_called_once_with(
            "1001",
            b"fake image bytes",
            False,
        )