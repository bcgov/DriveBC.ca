from apps.shared.tasks import populate_all_district_data
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def handle(self, *args, **options):
        populate_all_district_data()
