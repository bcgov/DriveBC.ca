import os
from apps.webcam.tasks import populate_all_webcam_data, populate_all_webcam_data_from_rabbitmq
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def handle(self, *args, **options):
        pull_from_rabbitmq = os.getenv("PULL_FROM_RABBITMQ", "false").lower() == "true"
        if pull_from_rabbitmq:
            populate_all_webcam_data_from_rabbitmq()
        else:
            populate_all_webcam_data()
