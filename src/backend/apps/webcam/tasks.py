import logging

from django.contrib.gis.geos import Point
from django.core.exceptions import ObjectDoesNotExist, FieldError

from apps.feed.client import FeedClient
from apps.webcam.models import Webcam

logger = logging.getLogger(__name__)


def populate_webcam_from_data(webcam_data):
    webcam_id = webcam_data.get('id')

    try:
        webcam = Webcam.objects.get(id=webcam_id)

    except ObjectDoesNotExist:
        webcam = Webcam(id=webcam_id)

    # Description
    webcam.name = webcam_data["camName"]
    webcam.caption = webcam_data["caption"]

    # Location
    webcam.region = webcam_data["region"]['group']
    webcam.region_name = webcam_data["region"]['name']
    webcam.highway = webcam_data["highway"]['number']
    webcam.highway_description = webcam_data["highway"]['locationDescription']
    webcam.highway_group = webcam_data["regionGroup"]['highwayGroup']
    webcam.highway_cam_order = webcam_data["regionGroup"]['highwayCamOrder']
    lng = webcam_data["location"]['longitude']
    lat = webcam_data["location"]['latitude']
    webcam.location = Point(lng, lat)
    webcam.orientation = webcam_data["orientation"]
    webcam.elevation = webcam_data["location"]['elevation']

    # General status
    webcam.is_on = webcam_data["isOn"]
    webcam.should_appear = webcam_data["shouldAppear"]
    webcam.is_new = webcam_data["isNew"]
    webcam.is_on_demand = webcam_data["isOnDemand"]

    # Update status
    webcam.marked_stale = webcam_data["imageStats"]["markedStale"]
    webcam.marked_delayed = webcam_data["imageStats"]["markedDelayed"]
    webcam.update_period_mean = webcam_data["imageStats"]["updatePeriodMean"]
    webcam.update_period_stddev = webcam_data["imageStats"]["updatePeriodStdDev"]
    webcam.last_update_attempt = webcam_data["imageStats"]['lastAttempt']['time']
    webcam.last_update_modified = webcam_data["imageStats"]['lastModified']['time']
    webcam.save()


def populate_all_webcams():
    feed_data = FeedClient().get_webcams()['webcams']
    for webcam_data in feed_data:
        try:
            populate_webcam_from_data(webcam_data)

        except (KeyError, FieldError) as e:
            webcam_id = webcam_data.get('id')
            logger.warning(f'Error while processing webcam ID {webcam_id}')
