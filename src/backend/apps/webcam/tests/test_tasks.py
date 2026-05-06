from unittest import IsolatedAsyncioTestCase
from unittest.mock import MagicMock, mock_open, patch
import time
from django.test import TestCase
from apps.webcam.tasks import backup_purge_old_images, backup_purge_old_pvc_images, populate_all_webcam_data, purge_old_images, purge_old_pvc_images, restore_backup_image, update_cam_status_from_sql_db, update_camera_is_on_status, update_camera_is_on_status, update_webcam_status_db, wrap_text

from apps.consumer.processor import (
    check_backup_exists,
    on_reconnect,
    on_close,
    on_channel_close,
    save_original_image_to_pvc,
    save_watermarked_image_to_drivebc_pvc,
    save_watermarked_image_to_pvc,
)


class TestRabbitMQCallbacks(IsolatedAsyncioTestCase):

    @patch("apps.consumer.processor.logger")
    async def test_on_reconnect(self, mock_logger):
        conn = MagicMock()

        before = time.time()

        await on_reconnect(conn)

        mock_logger.info.assert_called_once_with(
            "RabbitMQ connection re-established"
        )

        from apps.consumer import processor
        self.assertGreaterEqual(processor.last_activity, before)

    @patch("apps.consumer.processor.logger")
    async def test_on_close(self, mock_logger):
        conn = MagicMock()
        exc = Exception("connection lost")

        await on_close(conn, exc)

        mock_logger.warning.assert_called_once_with(
            f"RabbitMQ connection closed: {exc}"
        )

    @patch("apps.consumer.processor.logger")
    async def test_on_close_without_exception(self, mock_logger):
        conn = MagicMock()

        await on_close(conn)

        mock_logger.warning.assert_called_once_with(
            "RabbitMQ connection closed: None"
        )

    @patch("apps.consumer.processor.logger")
    async def test_on_channel_close(self, mock_logger):
        channel = MagicMock()
        exc = Exception("channel closed")

        await on_channel_close(channel, exc)

        mock_logger.warning.assert_called_once_with(
            f"RabbitMQ channel closed: {exc}"
        )

    @patch("apps.consumer.processor.logger")
    async def test_on_channel_close_without_exception(self, mock_logger):
        channel = MagicMock()

        await on_channel_close(channel)

        mock_logger.warning.assert_called_once_with(
            "RabbitMQ channel closed: None"
        )


class TestUpdateCamStatusFromSqlDb(TestCase):

    @patch("apps.webcam.tasks.CameraSource")
    def test_update_cam_status_from_sql_db_exception(
        self,
        mock_camera_source,
    ):
        mock_camera_source.objects.using.side_effect = Exception("Database error")

        result = update_cam_status_from_sql_db(1)

        self.assertEqual(result, {})

class TestOtherFunctions(TestCase):

    @patch("apps.consumer.processor.logging.exception")
    @patch("builtins.open", side_effect=OSError("Disk full"))
    @patch("apps.consumer.processor.PVC_ORIGINAL_PATH", "/tmp/images/original")
    def test_save_original_image_to_pvc_exception(
        self,
        mock_open,
        mock_exception,
    ):
        save_original_image_to_pvc("123", b"image")

        mock_exception.assert_called_once()

    @patch("apps.consumer.processor.logging.exception")
    @patch("builtins.open", side_effect=OSError("Disk full"))
    @patch("apps.consumer.processor.PVC_WATERMARKED_PATH", "/tmp/images/watermarked")
    def test_save_watermarked_image_to_pvc_exception(
        self,
        mock_open,
        mock_exception,
    ):
        save_watermarked_image_to_pvc(
            "123",
            b"image",
            "20250101000000",
            True,
        )

        mock_exception.assert_called_once()

    @patch("apps.consumer.processor.os.path.exists")
    @patch("apps.consumer.processor.DRIVEBC_PVC_WATERMARKED_PATH", "/tmp/images")
    def test_check_backup_exists_true(self, mock_exists):
        mock_exists.return_value = True

        self.assertTrue(check_backup_exists("123"))

    @patch("apps.consumer.processor.check_backup_exists")
    @patch("apps.consumer.processor.shutil.move")
    @patch("apps.consumer.processor.os.path.exists")
    @patch("builtins.open", new_callable=mock_open)
    def test_backup_already_exists(
        self,
        mock_file,
        mock_exists,
        mock_move,
        mock_backup,
    ):
        mock_exists.return_value = True
        mock_backup.return_value = True
        with patch(
            "apps.consumer.processor.DRIVEBC_PVC_WATERMARKED_PATH",
            "/tmp/images",
        ):
            save_watermarked_image_to_drivebc_pvc(
                "123",
                b"image",
                False,
            )

        mock_move.assert_not_called()

    @patch("apps.consumer.processor.check_backup_exists")
    @patch("apps.consumer.processor.shutil.move")
    @patch("apps.consumer.processor.os.path.exists")
    @patch("builtins.open", new_callable=mock_open)
    def test_backup_created(
        self,
        mock_file,
        mock_exists,
        mock_move,
        mock_backup,
    ):
        mock_exists.return_value = True
        mock_backup.return_value = False

        with patch(
            "apps.consumer.processor.DRIVEBC_PVC_WATERMARKED_PATH",
            "/tmp/images",
        ):
            save_watermarked_image_to_drivebc_pvc(
                "123",
                b"image",
                False,
            )

        mock_move.assert_called_once()


    @patch("apps.webcam.tasks.purge_old_pvc_images")
    @patch("apps.consumer.processor.os.getenv")
    def test_purge_old_images(self, mock_getenv, mock_purge):
        mock_getenv.return_value = "48"

        purge_old_images()

        mock_getenv.assert_called_once_with("REPLAY_THE_DAY_HOURS")
        mock_purge.assert_called_once_with(age="48")

    @patch("apps.webcam.tasks.backup_purge_old_pvc_images")
    def test_backup_purge_old_images(self, mock_backup):
        backup_purge_old_images()

        mock_backup.assert_called_once()

    
    @patch("apps.consumer.processor.os.remove")
    @patch("apps.consumer.processor.ImageIndex")
    def test_purge_old_pvc_images(self, mock_image_index, mock_remove):

        mock_row = MagicMock()
        mock_row.camera_id = "123"
        mock_row.timestamp.strftime.return_value = "20250101000000"
        mock_queryset = MagicMock()
        mock_queryset.__iter__.return_value = [mock_row]
        mock_image_index.objects.filter.return_value = mock_queryset
        with patch(
            "apps.consumer.processor.PVC_WATERMARKED_PATH",
            "/tmp/images",
        ):
            print(mock_image_index.objects.filter.return_value)
            print(list(mock_queryset))
            purge_old_pvc_images(age="24")
        mock_remove.assert_not_called()


    @patch("apps.consumer.processor.os.remove")
    @patch("apps.consumer.processor.os.walk")
    @patch("apps.consumer.processor.time.time")
    @patch("apps.consumer.processor.os.getenv")
    def test_backup_purge_old_pvc_images_delete(
        self,
        mock_getenv,
        mock_time,
        mock_walk,
        mock_remove,
    ):
        mock_getenv.return_value = "/tmp"

        mock_time.return_value = 100000

        mock_walk.return_value = [
            ("/tmp", [], ["a.jpg"])
        ]

        stat = MagicMock()
        stat.st_mtime = 1

        with patch("pathlib.Path.stat", return_value=stat):
            backup_purge_old_pvc_images()

        mock_remove.assert_called_once()

    @patch("apps.consumer.processor.logging.exception")
    @patch("apps.consumer.processor.os.walk")
    @patch("apps.consumer.processor.os.getenv")
    def test_backup_purge_old_pvc_images_exception(
        self,
        mock_getenv,
        mock_walk,
        mock_exception,
    ):
        mock_getenv.return_value = "/tmp"

        mock_walk.return_value = [
            ("/tmp", [], ["a.jpg"])
        ]

        with patch(
            "pathlib.Path.stat",
            side_effect=Exception("boom"),
        ):
            backup_purge_old_pvc_images()

        mock_exception.assert_called()

    @patch("apps.webcam.tasks.populate_webcam_from_data")
    @patch("apps.webcam.tasks.FeedClient")
    def test_populate_all_webcam_data(
        self,
        mock_feed,
        mock_populate,
    ):
        mock_feed.return_value.get_webcam_list.return_value = [
            {"id": 1},
            {"id": 2},
        ]

        populate_all_webcam_data()

        self.assertEqual(mock_populate.call_count, 2)

    @patch("apps.webcam.tasks.Webcam")
    def test_update_webcam_status_db_not_found(self, mock_webcam):
        mock_webcam.objects.only.return_value.filter.return_value.first.return_value = None

        result = update_webcam_status_db(123, {"isOn": 1})

        self.assertFalse(result)

    @patch("apps.webcam.tasks.restore_backup_image")
    @patch("apps.webcam.tasks.Webcam")
    def test_update_webcam_status_db_restore_backup(
        self,
        mock_webcam,
        mock_restore,
    ):
        webcam = MagicMock()
        webcam.is_on = False

        mock_webcam.objects.only.return_value.filter.return_value.first.return_value = webcam

        result = update_webcam_status_db(123, {"isOn": 1})

        self.assertTrue(result)
        mock_restore.assert_called_once_with("123")
        mock_webcam.objects.filter.return_value.update.assert_called_once_with(
            is_on=True
        )

    @patch("apps.webcam.tasks.restore_backup_image")
    @patch("apps.webcam.tasks.Webcam")
    def test_update_webcam_status_db_already_on(
        self,
        mock_webcam,
        mock_restore,
    ):
        webcam = MagicMock()
        webcam.is_on = True

        mock_webcam.objects.only.return_value.filter.return_value.first.return_value = webcam

        result = update_webcam_status_db(123, {"isOn": 1})

        self.assertTrue(result)
        mock_restore.assert_not_called()
        mock_webcam.objects.filter.return_value.update.assert_called_once_with(
            is_on=True
        )

    @patch("apps.webcam.tasks.restore_backup_image")
    @patch("apps.webcam.tasks.Webcam")
    def test_update_webcam_status_db_turn_off(
        self,
        mock_webcam,
        mock_restore,
    ):
        webcam = MagicMock()
        webcam.is_on = True

        mock_webcam.objects.only.return_value.filter.return_value.first.return_value = webcam

        result = update_webcam_status_db(123, {"isOn": 0})

        self.assertTrue(result)
        mock_restore.assert_not_called()
        mock_webcam.objects.filter.return_value.update.assert_called_once_with(
            is_on=False
        )

    @patch("apps.consumer.processor.logger")
    @patch("apps.consumer.processor.shutil.move")
    @patch("apps.consumer.processor.os.path.exists", return_value=True)
    @patch("apps.consumer.processor.os.getenv", return_value="/tmp/images")
    def test_restore_backup_image(
        self,
        mock_getenv,
        mock_exists,
        mock_move,
        mock_logger,
    ):
        restore_backup_image("123")

        mock_move.assert_called_once_with(
            "/tmp/images/backup/123.jpg",
            "/tmp/images/123.jpg",
        )
        mock_logger.info.assert_not_called()

    @patch("apps.consumer.processor.logger")
    @patch("apps.consumer.processor.shutil.move")
    @patch("apps.consumer.processor.os.path.exists", return_value=False)
    @patch("apps.consumer.processor.os.getenv", return_value="/tmp/images")
    def test_restore_backup_image_not_found(
        self,
        mock_getenv,
        mock_exists,
        mock_move,
        mock_logger,
    ):
        restore_backup_image("123")

        mock_move.assert_not_called()
        mock_logger.warning.assert_not_called()

    from unittest.mock import MagicMock

    def test_wrap_text_single_line(self):
        pen = MagicMock()
        font = MagicMock()

        pen.textlength.return_value = 20

        result = wrap_text(
            "hello world",
            pen,
            font,
            width=100,
        )

        self.assertEqual(result, "hello world")

    from unittest.mock import MagicMock

    def test_wrap_text_multiple_lines(self):
        pen = MagicMock()
        font = MagicMock()

        pen.textlength.return_value = 50

        result = wrap_text(
            "one two three",
            pen,
            font,
            width=75,
        )

        self.assertEqual(result, "one\ntwo\nthree")


    @patch("apps.webcam.tasks.update_camera_group_id")
    @patch("apps.webcam.tasks.update_cam_status_from_sql_db")
    @patch("apps.webcam.tasks.Webcam")
    def test_update_camera_is_on_status(
        self,
        mock_webcam,
        mock_update_status,
        mock_update_group,
    ):
        camera1 = MagicMock(id=1)
        camera2 = MagicMock(id=2)

        mock_webcam.objects.all.return_value = [camera1, camera2]

        # First camera updated, second not
        mock_update_status.side_effect = [True, False]

        update_camera_is_on_status()

        self.assertEqual(mock_update_status.call_count, 2)
        mock_update_status.assert_any_call(1)
        mock_update_status.assert_any_call(2)

        mock_update_group.assert_called_once_with(camera1)