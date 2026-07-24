from django.core.management.base import BaseCommand
import time

from apps.webcam.tasks import update_camera_is_on_status

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        self.stdout.write("Starting camera status monitor...")

        while True:
            update_camera_is_on_status()
            time.sleep(5)