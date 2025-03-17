from apps.border.tasks import update_border_crossing_lanes
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def handle(self, *args, **options):
        update_border_crossing_lanes()
