import os
from PIL import Image
from unittest.mock import patch, MagicMock, AsyncMock, mock_open
from datetime import datetime
import io

from aiormq import AMQPConnectionError
from django.test import TestCase
from django.core.cache import cache
import asyncio


from apps.consumer.processor import (
    PVC_ORIGINAL_PATH,
    blank_out_image,
    consume_from,
    consume_queue,
    process_camera_rows,
    get_timezone,
    process_message,
    safe_db_call,
    save_original_image_to_pvc,
    watermark,
    verify_image,
    push_to_s3,
    is_camera_pushed_too_soon,
    refresh_camera_cache,
)
from apps.webcam.models import Webcam
from apps.consumer import processor

from apps.consumer.processor import (
    save_watermarked_image_to_pvc,
    save_watermarked_image_to_drivebc_pvc,
    delete_watermarked_image_from_pvc,
    generate_local_timestamp,
    update_webcam,
    handle_image_message,
)

def reset_stop_event():
    processor.stop_event = asyncio.Event()

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

    def test_get_timezone_returns_default_when_coordinates_are_invalid(self):
        webcam = {
            "cam_locations_geo_latitude": "invalid",
            "cam_locations_geo_longitude": "-123.3656",
        }

        result = get_timezone(webcam)

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
            conn, queue = await setup_rabbitmq("142.34.229.61", "5064", "GOLD"),
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
                consume_from("142.34.229.61", "5064", "GOLD"),
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
                consume_from("142.34.229.61", "5064", "GOLD"),
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
                consume_from("142.34.229.61", "5064", "GOLD"),
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

        mock_consume.assert_called_once_with("142.34.229.61", "5064", "GOLD")


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

    @patch("apps.consumer.processor.logger")
    @patch("apps.consumer.processor.process_message", new_callable=AsyncMock)
    async def test_consume_queue_stop_event_breaks_loop(
        self,
        mock_process_message,
        mock_logger,
    ):
        message = MagicMock()

        # Mock the async context manager returned by queue.iterator()
        queue_iter = AsyncMock()
        queue_iter.__aiter__.return_value = [message]

        queue = MagicMock()
        queue.iterator.return_value.__aenter__.return_value = queue_iter
        queue.iterator.return_value.__aexit__.return_value = None

        with patch(
            "apps.consumer.processor.stop_event.is_set",
            return_value=True,
        ):
            await consume_queue(queue, "GOLD")

        mock_logger.info.assert_called_once_with(
            "Stop requested. Breaking consume loop for GOLD."
        )

        mock_process_message.assert_not_called()

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

class TestProcessMessage(TestCase):

    @patch("apps.consumer.processor.logger")
    @patch("apps.consumer.processor.handle_image_message", new_callable=AsyncMock)
    @patch("apps.consumer.processor.safe_db_call")
    @patch("apps.consumer.processor.generate_local_timestamp")
    @patch("apps.consumer.processor.calculate_camera_status")
    @patch("apps.consumer.processor.sync_to_async")
    async def test_process_message_success(
        self,
        mock_sync_to_async,
        mock_calculate_status,
        mock_generate_local_timestamp,
        mock_safe_db_call,
        mock_handle_image,
        mock_logger,
    ):
        message = MagicMock()
        message.headers = {
            "filename": "12345_20250101.jpg",
            "timestamp": "2025-01-01T00:00:00Z",
        }
        message.body = b"image"

        process_cm = AsyncMock()
        message.process.return_value = process_cm

        def sync_wrapper(func):
            if func == mock_calculate_status:
                return AsyncMock(return_value=True)
            return AsyncMock(return_value="local_timestamp")

        mock_sync_to_async.side_effect = sync_wrapper

        await process_message(message)

        mock_handle_image.assert_awaited_once_with(
            "12345",
            b"image",
            "local_timestamp",
            True,
        )

        mock_logger.info.assert_called_once_with(
            "Processed message for camera %s.",
            "12345",
        )

    @patch("apps.consumer.processor.logger")
    @patch(
        "apps.consumer.processor.handle_image_message",
        new_callable=AsyncMock,
        side_effect=asyncio.TimeoutError,
    )
    @patch("apps.consumer.processor.sync_to_async")
    async def test_process_message_timeout(
        self,
        mock_sync_to_async,
        mock_handle_image,
        mock_logger,
    ):
        message = MagicMock()
        message.headers = {
            "filename": "123.jpg",
            "timestamp": "2025",
        }
        message.body = b""

        message.process.return_value = AsyncMock()

        mock_sync_to_async.side_effect = [
            AsyncMock(return_value=True),
            AsyncMock(return_value="local"),
        ]

        await process_message(message)

        mock_logger.error.assert_called_once_with(
            "Processing timeout for camera 123"
        )

class TestWatermark(TestCase):

    def create_image(self, width=640, height=480):
        img = Image.new("RGB", (width, height), color="red")
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        return buf.getvalue()
    
    def test_returns_none_when_image_is_none(self):
        webcam = {"dbc_mark": "TEST"}

        result = watermark(
            webcam,
            None,
            "America/Vancouver",
            "20250720120000000000",
        )

        self.assertIsNone(result)

    def test_successfully_watermarks_image(self):
        webcam = {"dbc_mark": "DriveBC"}

        result = watermark(
            webcam,
            self.create_image(),
            "America/Vancouver",
            "20250720120000000000",
        )

        self.assertIsNotNone(result)

        img = Image.open(io.BytesIO(result))

        # original height = 480
        self.assertEqual(img.size, (640, 498))

    def test_missing_dbc_mark(self):
        webcam = {}

        result = watermark(
            webcam,
            self.create_image(),
            "America/Vancouver",
            "20250720120000000000",
        )

        self.assertIsNotNone(result)

    def test_invalid_timestamp_returns_none(self):
        webcam = {"dbc_mark": "DriveBC"}

        result = watermark(
            webcam,
            self.create_image(),
            "America/Vancouver",
            "bad timestamp",
        )

        self.assertIsNone(result)

    def test_invalid_image_returns_none(self):
        webcam = {"dbc_mark": "DriveBC"}

        result = watermark(
            webcam,
            b"not an image",
            "America/Vancouver",
            "20250720120000000000",
        )

        self.assertIsNone(result)

    def test_watermark_resizes_large_image(self):
        # Create a large image (width > 800)
        original_width = 1600
        original_height = 1000

        image = Image.new(
            "RGB",
            (original_width, original_height),
            color="black",
        )

        buffer = io.BytesIO()
        image.save(buffer, format="JPEG")

        webcam = {
            "dbc_mark": "DriveBC",
        }

        result = watermark(
            webcam=webcam,
            image_data=buffer.getvalue(),
            tz="America/Vancouver",
            timestamp="202607290900000000",
        )

        assert result is not None
        assert isinstance(result, bytes)

        # Verify the output image dimensions
        output = Image.open(io.BytesIO(result))

        # Expected:
        # width = 800
        # height = floor(1000 * 800 / 1600) + 18 black bar
        assert output.width == 800
        assert output.height == 518

class TestSaveImage(TestCase):

    def test_blank_out_image_returns_none_when_image_data_is_none(self):
        webcam = {
            "name": "Test Camera Offline",
            "dbc_mark": "DriveBC",
        }

        result = blank_out_image(
            webcam=webcam,
            image_data=None,
            tz="America/Vancouver",
            timestamp="20260729090000",
        )

        assert result is None

    def test_blank_out_image_success(self):
        image = Image.new("RGB", (720, 480), color="black")
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG")

        webcam = {
            "name": "Test Camera Offline",
            "dbc_mark": "DriveBC",
        }

        result = blank_out_image(
            webcam=webcam,
            image_data=buffer.getvalue(),
            tz="America/Vancouver",
            timestamp="20260729090000",
        )

        assert result is not None
        assert isinstance(result, bytes)

        generated = Image.open(io.BytesIO(result))
        assert generated.size == (720, 498)

    def test_blank_out_image_resizes_large_image(self):
        image = Image.new("RGB", (1600, 1000), color="black")
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG")

        webcam = {
            "name": "Test Camera Offline",
            "dbc_mark": "DriveBC",
        }

        result = blank_out_image(
            webcam=webcam,
            image_data=buffer.getvalue(),
            tz="America/Vancouver",
            timestamp="20260729090000",
        )

        generated = Image.open(io.BytesIO(result))

        assert generated.width == 800
        assert generated.height == 518      # floor(1000 * 800 / 1600) + 18

    def test_blank_out_image_with_no_message(self):
        image = Image.new("RGB", (720, 480), color="black")
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG")

        webcam = {
            "dbc_mark": "DriveBC",
        }

        result = blank_out_image(
            webcam=webcam,
            image_data=buffer.getvalue(),
            tz="America/Vancouver",
            timestamp="20260729090000",
        )

        assert result is not None

    @patch("apps.consumer.processor.logging.exception")
    @patch("apps.consumer.processor.Image.open")
    def test_blank_out_image_logs_exception(self, mock_open, mock_logging):
        mock_open.side_effect = Exception("Image error")

        webcam = {
            "name": "Test Camera Offline",
            "dbc_mark": "DriveBC",
        }

        result = blank_out_image(
            webcam=webcam,
            image_data=b"invalid image",
            tz="America/Vancouver",
            timestamp="20260729090000",
        )

        assert result is None
        mock_logging.assert_called_once()

    @patch("apps.consumer.processor.PVC_ORIGINAL_PATH", "/app/images/webcams/originals")
    @patch("apps.consumer.processor.open", new_callable=mock_open)
    @patch("apps.consumer.processor.os.makedirs")
    def test_save_original_image_to_pvc_success(
        self,
        mock_makedirs,
        mock_file,
    ):
        camera_id = "123"
        image_bytes = b"test image data"

        save_original_image_to_pvc(
            camera_id,
            image_bytes,
        )

        mock_makedirs.assert_called_once_with(
            "/app/images/webcams/originals",
            exist_ok=True,
        )

        mock_file.assert_called_once_with(
            "/app/images/webcams/originals/123.jpg",
            "wb",
        )

        mock_file().write.assert_called_once_with(image_bytes)
        
class TestDbCall(TestCase):

    @patch("apps.consumer.processor.connection")
    @patch("apps.consumer.processor.close_old_connections")
    def test_safe_db_call_success(
        self,
        mock_close_old_connections,
        mock_connection,
    ):
        mock_func = MagicMock(return_value="success")

        result = safe_db_call(mock_func, 1, 2, key="value")

        self.assertEqual(result, "success")
        mock_close_old_connections.assert_called_once()
        mock_connection.ensure_connection.assert_called_once()
        mock_func.assert_called_once_with(1, 2, key="value")

    @patch("apps.consumer.processor.connection")
    @patch("apps.consumer.processor.close_old_connections")
    def test_safe_db_call_propagates_exception(
        self,
        mock_close_old_connections,
        mock_connection,
    ):
        mock_func = MagicMock(side_effect=RuntimeError("DB error"))

        with self.assertRaises(RuntimeError):
            safe_db_call(mock_func)

        mock_close_old_connections.assert_called_once()
        mock_connection.ensure_connection.assert_called_once()
        mock_func.assert_called_once_with()

class TestSaveWatermarkedImageToPVC(TestCase):

    @patch("apps.consumer.processor.PVC_WATERMARKED_PATH", "/tmp/watermarked")
    @patch("apps.consumer.processor.open", new_callable=mock_open)
    @patch("apps.consumer.processor.os.makedirs")
    def test_save_watermarked_image_success(
        self,
        mock_makedirs,
        mock_file,
    ):
        save_watermarked_image_to_pvc(
            "123",
            b"image",
            "20260729090000",
            True,
        )

        self.assertTrue(mock_makedirs.called)

        mock_file.assert_called_once_with(
            "/tmp/watermarked/123/20260729090000.jpg",
            "wb",
        )

        mock_file().write.assert_called_once_with(b"image")


    @patch("apps.consumer.processor.logging.exception")
    @patch("apps.consumer.processor.open")
    @patch("apps.consumer.processor.os.makedirs")
    @patch("apps.consumer.processor.PVC_WATERMARKED_PATH", "/tmp")
    def test_save_watermarked_image_exception(
        self,
        mock_makedirs,
        mock_open_file,
        mock_logging,
    ):
        mock_open_file.side_effect = Exception("disk full")

        save_watermarked_image_to_pvc(
            "123",
            b"image",
            "20260729090000",
            True,
        )

        mock_logging.assert_called_once()

class TestSaveDriveBCImage(TestCase):

    @patch(
        "apps.consumer.processor.DRIVEBC_PVC_WATERMARKED_PATH",
        "/tmp/drivebc"
    )
    @patch("apps.consumer.processor.open", new_callable=mock_open)
    @patch("apps.consumer.processor.os.makedirs")
    @patch("apps.consumer.processor.os.path.exists")
    def test_save_drivebc_image_online(
        self,
        mock_exists,
        mock_makedirs,
        mock_file,
    ):

        mock_exists.return_value = False

        save_watermarked_image_to_drivebc_pvc(
            "123",
            b"image",
            True,
        )

        mock_file.assert_called_once_with(
            "/tmp/drivebc/123.jpg",
            "wb",
        )

        mock_file().write.assert_called_once_with(b"image")

class TestDeleteWatermarkedImage(TestCase):

    @patch(
        "apps.consumer.processor.PVC_WATERMARKED_PATH",
        "/tmp/watermarked"
    )
    @patch("apps.consumer.processor.os.remove")
    @patch("apps.consumer.processor.os.listdir")
    @patch("apps.consumer.processor.os.path.exists")
    def test_delete_watermarked_images(
        self,
        mock_exists,
        mock_listdir,
        mock_remove,
    ):

        mock_exists.return_value = True
        mock_listdir.return_value = [
            "1.jpg",
            "2.jpg",
        ]

        delete_watermarked_image_from_pvc("123")

        self.assertEqual(
            mock_remove.call_count,
            0
        )


    @patch(
        "apps.consumer.processor.PVC_WATERMARKED_PATH",
        "/tmp/watermarked"
    )
    @patch("apps.consumer.processor.os.path.exists")
    def test_delete_when_directory_missing(
        self,
        mock_exists,
    ):

        mock_exists.return_value = False

        delete_watermarked_image_from_pvc("123")

        mock_exists.assert_called_once()

class TestPushToS3(TestCase):

    @patch("apps.consumer.processor.requests.put")
    @patch("apps.consumer.processor.s3_client.generate_presigned_url")
    def test_push_to_s3_success(
        self,
        mock_url,
        mock_put,
    ):

        mock_url.return_value = "http://s3/upload"

        response = MagicMock()
        response.status_code = 200
        mock_put.return_value = response


        push_to_s3(
            b"image",
            "123",
            False,
            "20260729090000",
        )


        mock_put.assert_called_once()


    @patch("apps.consumer.processor.requests.put")
    @patch("apps.consumer.processor.s3_client.generate_presigned_url")
    def test_push_to_s3_failure(
        self,
        mock_url,
        mock_put,
    ):

        mock_url.return_value = "url"

        response = MagicMock()
        response.status_code = 500
        response.text = "error"

        mock_put.return_value = response


        with self.assertRaises(RuntimeError):
            push_to_s3(
                b"image",
                "123",
                False,
                "20260729090000",
            )

class TestHandleImageMessage(TestCase):

    def setUp(self):
        processor.db_data = [
            {
                "id": 123,
                "is_on": True,
                "cam_locations_geo_latitude": "49",
                "cam_locations_geo_longitude": "-123",
                "dbc_mark": "DriveBC",
            }
        ]

    @patch("apps.consumer.processor.save_original_image_to_pvc")
    @patch("apps.consumer.processor.update_webcam", new_callable=AsyncMock)
    @patch("apps.consumer.processor.Webcam")
    @patch("apps.consumer.processor.insert_image_index",
           new_callable=AsyncMock)
    @patch("apps.consumer.processor.push_to_s3")
    @patch("apps.consumer.processor.save_watermarked_image_to_drivebc_pvc")
    @patch("apps.consumer.processor.save_watermarked_image_to_pvc")
    @patch("apps.consumer.processor.watermark")
    @patch("apps.consumer.processor.verify_image")
    @patch("apps.consumer.processor.is_camera_pushed_too_soon",
           new_callable=AsyncMock)
    async def test_handle_image_message_camera_online(
        self,
        mock_too_soon,
        mock_verify,
        mock_watermark,
        mock_save_watermarked,
        mock_save_drivebc,
        mock_s3,
        mock_insert,
        mock_webcam,
        mock_update_webcam,
        save_original_image_to_pvc,
    ):

        mock_too_soon.return_value = False
        mock_verify.return_value = True
        mock_watermark.return_value = b"watermark"


        fake_webcam = MagicMock()
        fake_webcam.is_on = True

        mock_webcam.objects.filter.return_value.first.return_value = fake_webcam


        await handle_image_message(
            "123",
            b"image",
            "202607290900000000",
            {
                "mean_interval": 10,
                "stddev_interval": 5,
                "stale": False,
                "delayed": False,
            }
        )


        mock_verify.assert_called_once()

        mock_watermark.assert_called_once()

        mock_save_watermarked.assert_called_once()

        mock_save_drivebc.assert_called_once()

        mock_insert.assert_called_once()

    @patch("apps.consumer.processor.save_original_image_to_pvc")
    @patch("apps.consumer.processor.update_webcam", new_callable=AsyncMock)
    @patch("apps.consumer.processor.Webcam")
    @patch("apps.consumer.processor.push_to_s3")
    @patch("apps.consumer.processor.save_watermarked_image_to_drivebc_pvc")
    @patch("apps.consumer.processor.blank_out_image")
    @patch("apps.consumer.processor.verify_image")
    @patch(
        "apps.consumer.processor.is_camera_pushed_too_soon",
        new_callable=AsyncMock,
    )
    async def test_handle_image_message_camera_offline(
        self,
        mock_too_soon,
        mock_verify,
        mock_blank,
        mock_save_drivebc,
        mock_s3,
        mock_webcam,
        mock_update_webcam,
        mock_save_original_image,
    ):

        with patch.object(
            processor,
            "db_data",
            [
                {
                    "id": 123,
                    "is_on": False,
                }
            ],
        ):
            mock_too_soon.return_value = False
            mock_verify.return_value = True
            mock_blank.return_value = b"blank"

            mock_webcam.objects.filter.return_value.first.return_value = MagicMock()

            await handle_image_message(
                "123",
                b"image",
                "202607290900000000",
                {
                    "mean_interval": 10,
                    "stddev_interval": 5,
                    "stale": False,
                    "delayed": False,
                },
            )

        mock_blank.assert_called_once()
        mock_save_drivebc.assert_called_once()
        mock_save_original_image.assert_called_once_with("123", b"image")
        mock_update_webcam.assert_awaited_once()

class TestGenerateLocalTimestamp(TestCase):

    @patch("apps.consumer.processor.tf")
    def test_generate_local_timestamp_success(
        self,
        mock_tf
    ):

        mock_tf.timezone_at.return_value = (
            "America/Vancouver"
        )

        db_data = [
            {
                "id":1,
                "cam_locations_geo_latitude":"49",
                "cam_locations_geo_longitude":"-123",
            }
        ]

        result = generate_local_timestamp(
            db_data,
            "1",
            "202607290900000000"
        )

        self.assertIsNotNone(result)


    def test_generate_local_timestamp_camera_missing(self):

        result = generate_local_timestamp(
            [],
            "999",
            "202607290900000000"
        )

        self.assertIsNotNone(result)

class TestUpdateWebcam(TestCase):

    @patch("apps.consumer.processor.calculate_camera_status")
    @patch("apps.consumer.processor.Webcam")
    @patch("apps.consumer.processor.RegionHighway")
    @patch("apps.consumer.processor.Region")
    async def test_update_webcam_success(
        self,
        mock_region,
        mock_highway,
        mock_webcam,
        mock_status,
    ):

        mock_status.return_value = {
            "mean_interval":10,
            "stddev_interval":5,
            "stale":False,
            "delayed":False,
        }

        mock_region.objects.using.return_value.filter.return_value.first.return_value = MagicMock(
            seq=1,
            name="Region"
        )


        mock_highway.objects.using.return_value.filter.return_value.first.return_value = MagicMock(
            seq=1
        )


        mock_webcam.objects.update_or_create.return_value = (
            MagicMock(location=None),
            True
        )

        await update_webcam(
            1,
            datetime.now(),
            {
                "cam_locations_region":1,
                "cam_locations_highway":"1_Highway",
                "is_on":True
            }
        )

        mock_webcam.objects.update_or_create.assert_called_once()

    @patch(
        "apps.consumer.processor.setup_rabbitmq",
        new_callable=AsyncMock,
    )
    def test_consume_from_amqp_error(self, mock_setup):
        """consume_from retries when setup_rabbitmq raises AMQPConnectionError."""

        processor.stop_event.clear()

        async def setup_side_effect(*args, **kwargs):
            processor.stop_event.set()
            raise AMQPConnectionError()

        mock_setup.side_effect = setup_side_effect

        async def runner():
            await consume_from("url", "GOLD")

        asyncio.run(runner())

        mock_setup.assert_called_once()