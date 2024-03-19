import datetime
import json
import zoneinfo
from pathlib import Path
from unittest.mock import patch

from apps.shared import enums as shared_enums
from apps.shared.enums import CacheKey
from apps.shared.tests import BaseTest, MockResponse
from apps.webcam.models import Webcam
from apps.webcam.views import WebcamAPI
from django.contrib.gis.geos import Point
from django.core.cache import cache
from rest_framework.test import APITestCase


class TestWebcamUpdateImages(BaseTest):

    def test_webcam_image_update(self):
        pass
