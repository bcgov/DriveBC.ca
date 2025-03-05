from apps.border.tasks import populate_border_crossings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def handle(self, *args, **options):
        populate_border_crossings()
