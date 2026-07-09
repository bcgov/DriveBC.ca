from apps.shared.tasks import update_object_relations
from apps.webcam.models import Webcam
from apps.webcam.tasks import (
    add_order_to_cameras,
    populate_all_webcam_data,
    update_all_webcam_data,
    update_camera_nearby_objs,
)
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def handle(self, *args, **options):
        Webcam.objects.all().delete()
        populate_all_webcam_data()
        update_all_webcam_data()
        update_object_relations()
        add_order_to_cameras()
        update_camera_nearby_objs()
