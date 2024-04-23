from apps.webcam.tasks import add_order_to_cameras
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def handle(self, *args, **options):
        add_order_to_cameras()
