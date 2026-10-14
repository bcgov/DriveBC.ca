import datetime
import json
from pathlib import Path
from unittest.mock import patch

from apps.feed.serializers import WebcamAPISerializer
from apps.webcam.models import Webcam
from apps.webcam.serializers import WebcamSerializer
from django.core.management.base import BaseCommand
from django.test import override_settings

BACKEND_DIR = Path(__file__).resolve().parents[4]
OUTPUT_DIR = BACKEND_DIR.parent / 'frontend' / 'e2e' / 'fixtures' / 'api'

# must match API_HOST in src/frontend/playwright.config.js
E2E_API_HOST = 'http://api.e2e.test/'


def frozen_datetime(now):
    class FrozenDatetime(datetime.datetime):
        @classmethod
        def now(cls, tz=None):
            return now.astimezone(tz)

    return FrozenDatetime


def build_webcams():
    with open(BACKEND_DIR / 'apps/webcam/tests/test_data/webcam_feed_list_of_five.json') as f:
        serializer = WebcamAPISerializer(data=json.load(f))
    serializer.is_valid(raise_exception=True)

    # unsaved instances; no DB writes
    field_names = {field.name for field in Webcam._meta.get_fields()}
    cams = [
        Webcam(**{k: v for k, v in data.items() if k in field_names})
        for data in serializer.validated_data['webcams']
    ]

    # same as update_camera_group_id: lowest id at a location; null group collapses FE list
    for cam in cams:
        cam.group_id = min(c.id for c in cams if c.location.equals(cam.location))

    return cams


class Command(BaseCommand):
    help = 'Export API responses built from backend test data for frontend Playwright tests'

    def write(self, name, data):
        path = OUTPUT_DIR / f'{name}.json'
        path.write_text(json.dumps(data, indent=2, default=str) + '\n')
        self.stdout.write(f'Wrote {path.relative_to(BACKEND_DIR.parent)}')

    def handle(self, *args, **options):
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

        cams = build_webcams()

        # newest cam fresh, older ones stale/delayed
        now = max(c.last_update_modified for c in cams if c.last_update_modified) + datetime.timedelta(minutes=1)

        with override_settings(DRIVEBC_IMAGE_BASE_URL=E2E_API_HOST), \
                patch('apps.webcam.serializers.datetime', frozen_datetime(now)), \
                patch('apps.webcam.serializers.time.time', return_value=now.timestamp()):
            self.write('webcams', WebcamSerializer(cams, many=True).data)

        self.write('meta', {'now': now.isoformat()})
