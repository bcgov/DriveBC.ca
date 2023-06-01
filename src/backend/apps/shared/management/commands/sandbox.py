import logging
import time

from django.core.management.base import BaseCommand

logger = logging.getLogger(__name__)


def timed(method):
    def inner(*args, **kw):
        ts = time.time()
        method(*args, **kw)
        te = time.time()

        print('%r  %2.2f ms' % (method.__name__, (te - ts) * 1000))

    return inner


@timed
def sandbox_function():
    pass


class Command(BaseCommand):
    def handle(self, *args, **options):
        sandbox_function()
