from apps.weather.tasks import populate_all_regional_weather_data
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def handle(self, *args, **options):
        populate_all_regional_weather_data()
