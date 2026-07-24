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

            mock_save_drivebc.assert_called_once()
