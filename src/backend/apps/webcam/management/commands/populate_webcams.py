from apps.webcam.tasks import populate_all_webcams
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def handle(self, *args, **options):
        populate_all_webcams()
