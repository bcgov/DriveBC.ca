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

    @patch('apps.consumer.tasks.get_all_from_db')
    @patch('apps.consumer.tasks.process_camera_rows')
    def test_skips_online_cameras(self, mock_process_rows, mock_get_db):
        mock_get_db.return_value = []
        mock_process_rows.return_value = [
            {'id': 1, 'is_on': True, 'cam_internet_name': 'Camera 1'},
            {'id': 2, 'is_on': True, 'cam_internet_name': 'Camera 2'},
        ]

        with patch('apps.consumer.tasks.watermark') as mock_watermark, \
             patch('apps.consumer.tasks.save_watermarked_image_to_pvc') as mock_save_pvc, \
             patch('apps.consumer.tasks.save_watermarked_image_to_drivebc_pvc') as mock_save_drivebc, \
             patch('apps.consumer.tasks.push_to_s3') as mock_push_s3, \
             patch('apps.consumer.tasks.insert_image_and_update_webcam') as mock_insert:

            generate_offline_camera_images()

            mock_watermark.assert_not_called()
            mock_save_pvc.assert_not_called()
            mock_push_s3.assert_not_called()
            mock_insert.assert_not_called()

    @patch('apps.consumer.tasks.get_all_from_db')
    @patch('apps.consumer.tasks.process_camera_rows')
    def test_generates_for_offline_cameras(self, mock_process_rows, mock_get_db):
        mock_get_db.return_value = []
        mock_process_rows.return_value = [
            {'id': 1, 'is_on': False, 'cam_internet_name': 'Camera 1'},
        ]

        with patch('apps.consumer.tasks.watermark') as mock_watermark, \
             patch('apps.consumer.tasks.save_watermarked_image_to_pvc') as mock_save_pvc, \
             patch('apps.consumer.tasks.save_watermarked_image_to_drivebc_pvc') as mock_save_drivebc, \
             patch('apps.consumer.tasks.push_to_s3') as mock_push_s3, \
             patch('apps.consumer.tasks.insert_image_and_update_webcam', return_value=None) as mock_insert:

            mock_watermark.return_value = b'watermarked_image_bytes'

            generate_offline_camera_images()

            mock_watermark.assert_called_once()
            mock_save_pvc.assert_called_once()
            mock_save_drivebc.assert_called_once()
            mock_push_s3.assert_called_once()
            mock_insert.assert_called_once()

    @patch('apps.consumer.tasks.get_all_from_db')
    @patch('apps.consumer.tasks.process_camera_rows')
    def test_handles_empty_camera_list(self, mock_process_rows, mock_get_db):
        mock_get_db.return_value = []
        mock_process_rows.return_value = []

        with patch('apps.consumer.tasks.watermark') as mock_watermark, \
             patch('apps.consumer.tasks.save_watermarked_image_to_pvc') as mock_save_pvc, \
             patch('apps.consumer.tasks.push_to_s3') as mock_push_s3, \
             patch('apps.consumer.tasks.insert_image_and_update_webcam', return_value=None) as mock_insert:

            generate_offline_camera_images()

            mock_watermark.assert_not_called()
            mock_save_pvc.assert_not_called()
            mock_push_s3.assert_not_called()
            mock_insert.assert_not_called()

    @patch('apps.consumer.tasks.get_all_from_db')
    @patch('apps.consumer.tasks.process_camera_rows')
    def test_handles_watermark_failure(self, mock_process_rows, mock_get_db):
        mock_get_db.return_value = []
        mock_process_rows.return_value = [
            {'id': 1, 'is_on': False, 'cam_internet_name': 'Camera 1'},
        ]

        with patch('apps.consumer.tasks.watermark') as mock_watermark, \
             patch('apps.consumer.tasks.save_watermarked_image_to_pvc') as mock_save_pvc, \
             patch('apps.consumer.tasks.save_watermarked_image_to_drivebc_pvc') as mock_save_drivebc, \
             patch('apps.consumer.tasks.push_to_s3') as mock_push_s3, \
             patch('apps.consumer.tasks.insert_image_and_update_webcam', return_value=None) as mock_insert:

            mock_watermark.return_value = None

            generate_offline_camera_images()

            mock_watermark.assert_called_once()
            mock_save_pvc.assert_not_called()
            mock_save_drivebc.assert_not_called()
            mock_push_s3.assert_not_called()
            mock_insert.assert_not_called()

    @patch('apps.consumer.tasks.get_all_from_db')
    @patch('apps.consumer.tasks.process_camera_rows')
    def test_handles_is_on_key_missing(self, mock_process_rows, mock_get_db):
        mock_get_db.return_value = []
        mock_process_rows.return_value = [
            {'id': 1, 'cam_internet_name': 'Camera 1'},
        ]

        with patch('apps.consumer.tasks.watermark') as mock_watermark, \
             patch('apps.consumer.tasks.save_watermarked_image_to_pvc') as mock_save_pvc, \
             patch('apps.consumer.tasks.push_to_s3') as mock_push_s3, \
             patch('apps.consumer.tasks.insert_image_and_update_webcam', return_value=None) as mock_insert:

            mock_watermark.return_value = b'watermarked_image_bytes'

            generate_offline_camera_images()

            mock_watermark.assert_not_called()
            mock_save_pvc.assert_not_called()
            mock_push_s3.assert_not_called()
            mock_insert.assert_not_called()
