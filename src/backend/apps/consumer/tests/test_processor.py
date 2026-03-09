from unittest.mock import patch, MagicMock
from datetime import datetime
import io

from django.test import TestCase
from django.core.cache import cache

from apps.consumer.processor import (
    process_camera_rows,
    get_timezone,
    watermark,
    verify_image,
    push_to_s3,
    is_camera_pushed_too_soon,
    refresh_camera_cache,
)
from apps.webcam.models import Webcam


class MockCameraRow:
    """Mock camera row object for testing process_camera_rows"""
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)


class TestProcessCameraRows(TestCase):
    def test_process_camera_rows_with_valid_data(self):
        rows = [
            MockCameraRow(
                id=1,
                cam_internetname='Camera 1',
                cam_internetcaption='Test Caption',
                cam_internetcomments='Test Comments',
                cam_locationsorientation='N',
                cam_locationsgeo_latitude=49.887,
                cam_locationsgeo_longitude=-119.496,
                cam_locationssegment='Segment1',
                cam_locationslrs_node='LRSA',
                cam_locationsregion='R1',
                cam_locationshighway='1',
                cam_locationshighway_section='A',
                cam_locationselevation=100,
                cam_internetdbc_mark='MARK1',
                cam_controldisabled=False,
                cam_maintenanceis_on_demand=False,
                isnew=False,
                seq=1,
            )
        ]

        result = process_camera_rows(rows)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['id'], 1)
        self.assertEqual(result[0]['cam_internet_name'], 'Camera 1')
        self.assertEqual(result[0]['cam_internet_caption'], 'Test Caption')
        self.assertEqual(result[0]['is_on'], True)
        self.assertEqual(result[0]['cam_maintenanceis_on_demand'], False)

    def test_process_camera_rows_with_disabled_camera(self):
        rows = [
            MockCameraRow(
                id=2,
                cam_internetname='Camera 2',
                cam_internetcaption='',
                cam_internetcomments='',
                cam_locationsorientation='',
                cam_locationsgeo_latitude=0,
                cam_locationsgeo_longitude=0,
                cam_locationssegment='',
                cam_locationslrs_node='',
                cam_locationsregion='',
                cam_locationshighway='',
                cam_locationshighway_section='',
                cam_locationselevation=0,
                cam_internetdbc_mark='',
                cam_controldisabled=True,
                cam_maintenanceis_on_demand=False,
                isnew=False,
                seq=2,
            )
        ]

        result = process_camera_rows(rows)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['is_on'], False)

    def test_process_camera_rows_with_empty_rows(self):
        result = process_camera_rows([])
        self.assertEqual(result, [])


class TestGetTimezone(TestCase):
    @patch('apps.consumer.processor.tf')
    def test_get_timezone_valid_coordinates(self, mock_tf):
        mock_tf.timezone_at.return_value = 'America/Vancouver'

        result = get_timezone({'cam_locations_geo_latitude': '49.887', 'cam_locations_geo_longitude': '-119.496'})

        self.assertEqual(result, 'America/Vancouver')

    @patch('apps.consumer.processor.tf')
    def test_get_timezone_returns_default(self, mock_tf):
        mock_tf.timezone_at.return_value = None

        result = get_timezone({'cam_locations_geo_latitude': '0', 'cam_locations_geo_longitude': '0'})

        self.assertEqual(result, 'America/Vancouver')

    @patch('apps.consumer.processor.tf')
    def test_get_timezone_with_empty_coordinates(self, mock_tf):
        mock_tf.timezone_at.return_value = None

        result = get_timezone({'cam_locations_geo_latitude': '', 'cam_locations_geo_longitude': ''})

        self.assertEqual(result, 'America/Vancouver')


class TestWatermark(TestCase):
    def test_watermark_with_none_image_data(self):
        webcam = {'id': 1, 'is_on': True, 'dbc_mark': 'TEST'}

        result = watermark(webcam, None, 'America/Vancouver', '20260309120000000')

        self.assertIsNone(result)


class TestVerifyImage(TestCase):
    def test_verify_image_valid_jpeg(self):
        from PIL import Image
        img_byte_arr = io.BytesIO()
        img = Image.new('RGB', (100, 100), color='red')
        img.save(img_byte_arr, format='JPEG')
        img_byte_arr.seek(0)
        image_data = img_byte_arr.read()

        result = verify_image(image_data, '1')

        self.assertTrue(result)

    def test_verify_image_invalid_data(self):
        image_data = b'not an image data'

        result = verify_image(image_data, '1')

        self.assertFalse(result)


class TestIsCameraPushedTooSoon(TestCase):
    @patch('apps.consumer.processor.ImageIndex')
    def test_returns_false_when_no_previous_image(self, mock_image_index):
        mock_image_index.objects.filter.return_value.order_by.return_value.first.return_value = None

        import asyncio

        async def run_test():
            return await is_camera_pushed_too_soon('1', '20260309120000000')

        result = asyncio.run(run_test())

        self.assertFalse(result)


class TestRefreshCameraCache(TestCase):
    def setUp(self):
        super().setUp()
        cache.clear()
        from apps.consumer import processor
        processor.db_data = []
        processor.last_camera_refresh = {}

    def tearDown(self):
        super().tearDown()
        cache.clear()
        from apps.consumer import processor
        processor.db_data = []
        processor.last_camera_refresh = {}

    @patch('apps.consumer.processor.get_all_from_db')
    @patch('apps.consumer.processor.process_camera_rows')
    def test_refresh_camera_cache_cache_hit(self, mock_process, mock_get_db):
        from apps.consumer import processor
        import asyncio

        processor.last_camera_refresh = {'1': float('inf')}

        async def run_test():
            return await refresh_camera_cache('1')

        asyncio.run(run_test())

        mock_get_db.assert_not_called()

    @patch('apps.consumer.processor.get_all_from_db')
    @patch('apps.consumer.processor.process_camera_rows')
    def test_refresh_camera_cache_cache_miss(self, mock_process, mock_get_db):
        from apps.consumer import processor
        import asyncio

        mock_get_db.return_value = []
        mock_process.return_value = [{'id': 1, 'is_on': True}]
        processor.last_camera_refresh = {'1': 0}

        async def run_test():
            return await refresh_camera_cache('1')

        asyncio.run(run_test())

        mock_get_db.assert_called_once_with('1')
        mock_process.assert_called_once()
