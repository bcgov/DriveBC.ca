from apps.border.models import BorderCrossing
from apps.dms.models import Dms
from apps.event.models import Event
from apps.ferry.models import Ferry
from apps.rest.models import RestStop
from apps.weather.models import CurrentWeather, HighElevationForecast, RegionalWeather
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Remove all test rows created by populate_offsetting_test_data'

    def handle(self, *args, **options):
        total = 0

        total += Event.objects.filter(id__startswith='TEST-').delete()[0]
        total += Dms.objects.filter(id__startswith='TEST-').delete()[0]
        total += BorderCrossing.objects.filter(id__in=[9901, 9902, 9903, 9904]).delete()[0]
        total += Ferry.objects.filter(id__in=[9901, 9902, 9903]).delete()[0]
        total += CurrentWeather.objects.filter(weather_station_name__startswith='Test Weather').delete()[0]
        total += RegionalWeather.objects.filter(code__startswith='TEST-').delete()[0]
        total += RestStop.objects.filter(rest_stop_id__startswith='TEST-').delete()[0]
        total += HighElevationForecast.objects.filter(code__startswith='TEST-').delete()[0]

        self.stdout.write(self.style.SUCCESS(f'Deleted {total} test rows'))
