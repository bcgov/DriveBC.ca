import datetime
import logging

import pytz
from django.core.exceptions import ObjectDoesNotExist

from apps.feed.client import FeedClient
from apps.webcam.models import Webcam
from apps.webcam.serializers import WebcamSerializer

logger = logging.getLogger(__name__)


def populate_webcam_from_data(webcam_data):
    webcam_id = webcam_data.get('id')

    try:
        webcam = Webcam.objects.get(id=webcam_id)

    except ObjectDoesNotExist:
        webcam = Webcam(id=webcam_id)

    webcam_serializer = WebcamSerializer(webcam, data=webcam_data)
    webcam_serializer.is_valid(raise_exception=True)
    webcam_serializer.save()


def populate_all_webcams():
    feed_data = FeedClient().get_webcam_list()['webcams']
    for webcam_data in feed_data:
        populate_webcam_from_data(webcam_data)


def update_webcam(webcam):
    webcam_data = FeedClient().get_webcam(webcam)
    webcam_serializer = WebcamSerializer(webcam, data=webcam_data)
    webcam_serializer.is_valid(raise_exception=True)
    webcam_serializer.save()


def update_exisitng_webcams():
    for webcam in Webcam.objects.filter(should_appear=True):
        current_time = datetime.datetime.now(tz=pytz.timezone('America/Vancouver'))
        if webcam.should_update(current_time):
            update_webcam(webcam)
