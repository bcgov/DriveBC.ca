import datetime
import logging
import sys

from django.core.cache import cache
from django.core.management.base import BaseCommand

logger = logging.getLogger(__name__)


def huey_health_check():
    last_task_execution = cache.get('last_task_execution')
    time_diff = datetime.datetime.now() - last_task_execution

    # Exit with a failure if the last task execution was more than 5 minutes ago
    if time_diff.total_seconds() > 300:
        sys.exit(1)


class Command(BaseCommand):
    def handle(self, *args, **options):
        huey_health_check()
