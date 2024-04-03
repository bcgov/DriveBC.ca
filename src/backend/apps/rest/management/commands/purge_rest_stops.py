from apps.rest.models import RestStop
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def handle(self, *args, **options):
        RestStop.objects.all().delete()
