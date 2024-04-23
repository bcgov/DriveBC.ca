from apps.webcam.tasks import build_route_geometries
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def handle(self, *args, **options):
        build_route_geometries()
