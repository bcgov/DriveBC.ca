import datetime
import logging

import pytz
from apps.feed.client import FeedClient
from apps.webcam.enums import CAMERA_DIFF_FIELDS
from apps.webcam.models import Webcam
from apps.webcam.serializers import WebcamSerializer
from apps.webcam.views import WebcamAPI
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)


def populate_webcam_from_data(webcam_data):
    webcam_id = webcam_data.get("id")

    try:
        webcam = Webcam.objects.get(id=webcam_id)

    except ObjectDoesNotExist:
        webcam = Webcam(id=webcam_id)

    webcam_serializer = WebcamSerializer(webcam, data=webcam_data)
    webcam_serializer.is_valid(raise_exception=True)
    webcam_serializer.save()


def populate_all_webcam_data():
    feed_data = FeedClient().get_webcam_list()["webcams"]
    for webcam_data in feed_data:
        populate_webcam_from_data(webcam_data)

    # Rebuild cache
    WebcamAPI().set_list_data()


def update_single_webcam_data(webcam):
    webcam_data = FeedClient().get_webcam(webcam)

    # Only update if existing data differs for at least one of the fields
    for field in CAMERA_DIFF_FIELDS:
        if getattr(webcam, field) != webcam_data[field]:
            webcam_serializer = WebcamSerializer(webcam, data=webcam_data)
            webcam_serializer.is_valid(raise_exception=True)
            webcam_serializer.save()
            return


def update_all_webcam_data():
    for webcam in Webcam.objects.all():
        current_time = datetime.datetime.now(tz=pytz.timezone("America/Vancouver"))
        if webcam.should_update(current_time):
            update_single_webcam_data(webcam)

    # Rebuild cache
    WebcamAPI().set_list_data()
