from apps.webcam.tasks import update_single_webcam_data
from django.core.management.base import BaseCommand

from apps.webcam.models import Webcam

class Command(BaseCommand):

    def add_arguments(self , parser):
        parser.add_argument('id' , nargs='?' , type=int)

    def handle(self, id, *args, **options):
        cam = Webcam.objects.get(id=id)
        update_single_webcam_data(cam)
