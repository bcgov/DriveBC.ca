from apps.shared.tasks import update_object_relations
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def handle(self, *args, **options):
        update_object_relations()
