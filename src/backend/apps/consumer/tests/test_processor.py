import os
from unittest.mock import patch, MagicMock, AsyncMock
from datetime import datetime
import io

from django.test import TestCase
from django.core.cache import cache
import asyncio


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
from apps.consumer import processor


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
                cam_controldisappear=False,
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

class TestRabbitMQConsumer(TestCase):

    def setUp(self):
        super().setUp()

    def tearDown(self):
        super().tearDown()

    # setup_rabbitmq tests
    @patch("apps.consumer.processor.aio_pika.connect_robust")
    def test_setup_rabbitmq_success(self, mock_connect):
        from apps.consumer.processor import setup_rabbitmq

        mock_connection = AsyncMock()
        mock_channel = AsyncMock()
        mock_queue = AsyncMock()

        mock_connect.return_value = mock_connection
        mock_connection.channel.return_value = mock_channel
        mock_channel.declare_queue.return_value = mock_queue

        async def run_test():
            conn, queue = await setup_rabbitmq(os.getenv("RABBITMQ_URL_GOLD"), "GOLD")
            return conn, queue

        conn, queue = asyncio.run(run_test())

        self.assertEqual(conn, mock_connection)
        self.assertEqual(queue, mock_queue)
        mock_connect.assert_called_once()

    # consume_queue tests
    @patch("apps.consumer.processor.process_message", new_callable=AsyncMock)
    def test_consume_queue_processes_messages(self, mock_process):
        from apps.consumer.processor import consume_queue

        mock_queue = MagicMock()

        mock_message = MagicMock()

        # Create async iterator
        async def async_iter():
            yield mock_message

        # Mock context manager
        mock_iterator = MagicMock()
        mock_iterator.__aenter__ = AsyncMock(return_value=async_iter())
        mock_iterator.__aexit__ = AsyncMock(return_value=None)

        mock_queue.iterator.return_value = mock_iterator

        async def run_test():
            await consume_queue(mock_queue, "GOLD")

        asyncio.run(run_test())

        mock_process.assert_called_once_with(mock_message)

    @patch("apps.consumer.processor.process_message", new_callable=AsyncMock)
    def test_consume_queue_handles_processing_error(self, mock_process):
        from apps.consumer.processor import consume_queue

        mock_queue = MagicMock()
        mock_message = MagicMock()

        # Async iterator that yields one message
        async def async_iter():
            yield mock_message

        # Mock async context manager
        mock_iterator = MagicMock()
        mock_iterator.__aenter__ = AsyncMock(return_value=async_iter())
        mock_iterator.__aexit__ = AsyncMock(return_value=None)

        mock_queue.iterator.return_value = mock_iterator

        # Simulate processing failure
        mock_process.side_effect = Exception("boom")

        async def run_test():
            await consume_queue(mock_queue, "GOLD")

        asyncio.run(run_test())

        mock_process.assert_called_once_with(mock_message)

    # consume_from tests
    @patch("apps.consumer.processor.consume_queue", new_callable=AsyncMock)
    @patch("apps.consumer.processor.setup_rabbitmq", new_callable=AsyncMock)
    def test_consume_from_success_flow(self, mock_setup, mock_consume):
        from apps.consumer.processor import consume_from, stop_event

        stop_event.clear()

        mock_connection = AsyncMock()
        mock_connection.is_closed = False
        mock_queue = MagicMock()

        mock_setup.return_value = (mock_connection, mock_queue)

        async def run_test():
            # stop after first iteration
            async def stop_later():
                await asyncio.sleep(0.01)
                stop_event.set()

            await asyncio.gather(
                consume_from(os.getenv("RABBITMQ_URL_GOLD"), "GOLD"),
                stop_later()
            )

        asyncio.run(run_test())

        mock_setup.assert_called_once()
        mock_consume.assert_called_once()
        mock_connection.close.assert_called_once()

        stop_event.clear()

    @patch("apps.consumer.processor.setup_rabbitmq", new_callable=AsyncMock)
    def test_consume_from_reconnect_on_error(self, mock_setup):
        from apps.consumer.processor import consume_from, stop_event

        stop_event.clear()

        mock_setup.side_effect = Exception("connection error")

        async def run_test():
            async def stop_later():
                await asyncio.sleep(0.01)
                stop_event.set()

            await asyncio.gather(
                consume_from(os.getenv("RABBITMQ_URL_GOLD"), "GOLD"),
                stop_later()
            )

        asyncio.run(run_test())

        self.assertTrue(mock_setup.called)

        stop_event.clear()

    @patch("apps.consumer.processor.setup_rabbitmq", new_callable=AsyncMock)
    @patch("apps.consumer.processor.consume_queue", new_callable=AsyncMock)
    def test_consume_from_closes_connection(self, mock_consume, mock_setup):
        from apps.consumer.processor import consume_from, stop_event

        stop_event.clear()

        mock_connection = AsyncMock()
        mock_connection.is_closed = False
        mock_queue = MagicMock()

        mock_setup.return_value = (mock_connection, mock_queue)

        async def run_test():
            async def stop_later():
                await asyncio.sleep(0.01)
                stop_event.set()

            await asyncio.gather(
                consume_from(os.getenv("RABBITMQ_URL_GOLD"), "GOLD"),
                stop_later()
            )

        asyncio.run(run_test())

        mock_connection.close.assert_called_once()

        stop_event.clear()

    def test_run_consumer_no_urls_raises(self):
        from apps.consumer.processor import run_consumer, stop_event

        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(RuntimeError):
                asyncio.run(run_consumer())

    @patch("apps.consumer.processor.consume_from", new_callable=AsyncMock)
    def test_run_consumer_gold_only(self, mock_consume):
        import asyncio
        from apps.consumer import processor

        reset_stop_event()

        with patch.dict(os.environ, {
            "RABBITMQ_URL_GOLD": "amqp://gold"
        }, clear=True):

            async def run_test():
                consumer_task = asyncio.create_task(
                    processor.run_consumer()
                )

                # give consumer time to start
                await asyncio.sleep(0.01)

                processor.stop_event.set()

                await consumer_task

            asyncio.run(run_test())

        mock_consume.assert_called_once_with("amqp://gold", "GOLD")


    @patch("apps.consumer.processor.consume_from", new_callable=AsyncMock)
    def test_run_consumer_both_urls(self, mock_consume):
        reset_stop_event()

        with patch.dict(os.environ, {
            "RABBITMQ_URL_GOLD": "amqp://gold",
            "RABBITMQ_URL_GOLDDR": "amqp://golddr"
        }):
            async def run_test():
                consumer_task = asyncio.create_task(
                    processor.run_consumer()
                )

                # give consumer time to start
                await asyncio.sleep(0.01)

                processor.stop_event.set()

                await consumer_task

            asyncio.run(run_test())

        self.assertEqual(mock_consume.call_count, 2)


    @patch("apps.consumer.processor.consume_from", new_callable=AsyncMock)
    def test_run_consumer_cancels_tasks(self, mock_consume):
        reset_stop_event()

        with patch.dict(os.environ, {
            "RABBITMQ_URL_GOLD": "amqp://gold"
        }, clear=True):

            async def run_test():
                consumer_task = asyncio.create_task(
                    processor.run_consumer()
                )

                # give consumer time to start
                await asyncio.sleep(0.01)

                processor.stop_event.set()

                await consumer_task

            asyncio.run(run_test())

        mock_consume.assert_called_once()

    def test_shutdown_sets_event(self):
        from apps.consumer.processor import shutdown, stop_event

        reset_stop_event()

        shutdown()

        self.assertTrue(stop_event.is_set())

class TestParseRows(TestCase):

    @patch("apps.consumer.processor.process_camera_rows")
    @patch("apps.consumer.processor.get_all_from_db")
    def test_parse_rows_success(self, mock_get_db, mock_process):
        from apps.consumer.processor import parse_rows

        mock_get_db.return_value = ["row1", "row2"]
        mock_process.return_value = [{"camera": 1}, {"camera": 2}]

        async def run_test():
            result = await parse_rows(os.getenv("RABBITMQ_URL_GOLD"))

            self.assertEqual(result, [{"camera": 1}, {"camera": 2}])

        asyncio.run(run_test())

        mock_get_db.assert_called_once()
        mock_process.assert_called_once_with(["row1", "row2"])

    @patch("apps.consumer.processor.process_camera_rows")
    @patch("apps.consumer.processor.get_all_from_db")
    def test_parse_rows_empty_raises(self, mock_get_db, mock_process):
        from apps.consumer.processor import parse_rows

        mock_get_db.return_value = []
        mock_process.return_value = []

        async def run_test():
            with self.assertRaises(RuntimeError) as ctx:
                await parse_rows(os.getenv("RABBITMQ_URL_GOLD"))

            self.assertIn("No camera data available", str(ctx.exception))

        asyncio.run(run_test())

        mock_get_db.assert_called_once()
        mock_process.assert_called_once_with([])

    @patch("apps.consumer.processor.logger")
    @patch("apps.consumer.processor.process_camera_rows")
    @patch("apps.consumer.processor.get_all_from_db")
    def test_parse_rows_logs_success(self, mock_get_db, mock_process, mock_logger):
        from apps.consumer.processor import parse_rows

        mock_get_db.return_value = ["row1"]
        mock_process.return_value = [{"camera": 1}]

        async def run_test():
            await parse_rows(os.getenv("RABBITMQ_URL_GOLD"))

        asyncio.run(run_test())

        mock_logger.info.assert_called()

def reset_stop_event():
    import asyncio
    from apps.consumer import processor

    processor.stop_event = asyncio.Event()