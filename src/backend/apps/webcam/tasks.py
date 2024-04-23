import datetime
import io
import logging
import os
import urllib.request
from itertools import groupby
from math import floor
from pathlib import Path

import environ
import pytz
import requests
from apps.feed.client import FeedClient
from apps.shared.models import RouteGeometry
from apps.webcam.enums import CAMERA_DIFF_FIELDS
from apps.webcam.hwy_coords import hwy_coords
from apps.webcam.models import Webcam
from apps.webcam.serializers import WebcamSerializer
from apps.webcam.views import WebcamAPI
from django.conf import settings
from django.contrib.gis.geos import LineString, MultiLineString, Point
from django.core.exceptions import ObjectDoesNotExist
from PIL import Image, ImageDraw, ImageFont

# Base dir and env
BASE_DIR = Path(__file__).resolve().parents[4]
env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env', overwrite=True)
logger = logging.getLogger(__name__)

APP_DIR = Path(__file__).resolve().parent
FONT = ImageFont.truetype(f'{APP_DIR}/static/BCSans.otf', size=14)
CAMS_DIR = f'{settings.SRC_DIR}/images/webcams'


def populate_webcam_from_data(webcam_data):
    webcam_id = webcam_data.get("id")

    try:
        webcam = Webcam.objects.get(id=webcam_id)

    except ObjectDoesNotExist:
        webcam = Webcam(id=webcam_id)

    webcam_serializer = WebcamSerializer(webcam, data=webcam_data)
    webcam_serializer.is_valid(raise_exception=True)
    webcam_serializer.save()
    update_webcam_image(webcam_data)


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
            update_webcam_image(webcam_data)
            return


def update_all_webcam_data():
    for webcam in Webcam.objects.all():
        current_time = datetime.datetime.now(tz=pytz.timezone("America/Vancouver"))
        if webcam.should_update(current_time):
            update_single_webcam_data(webcam)

    # Rebuild cache
    WebcamAPI().set_list_data()


def update_webcam_image(webcam):
    '''
    Retrieve the current cam image, stamp it and save it

    Per JIRA ticket DBC22-1857

    '''

    try:
        # retrieve source image into a file-like buffer
        base_url = settings.DRIVEBC_WEBCAM_API_BASE_URL
        if base_url[-1] == '/':
            base_url = base_url[:-1]
        endpoint = f'{base_url}/webcams/{webcam["id"]}/imageSource'

        with urllib.request.urlopen(endpoint) as url:
            image_data = io.BytesIO(url.read())

        raw = Image.open(image_data)
        width, height = raw.size
        if width > 800:
            ratio = 800 / width
            width = 800
            height = floor(height * ratio)
            raw = raw.resize((width, height))

        stamped = Image.new('RGB', (width, height + 18))
        stamped.paste(raw)  # leaves 18 pixel black bar left at bottom

        # add mark and timestamp to black bar
        pen = ImageDraw.Draw(stamped)
        mark = webcam.get('dbc_mark', '')
        pen.text((3,  height + 14), mark, fill="white", anchor='ls', font=FONT)

        lastmod = webcam.get('last_update_modified')
        timestamp = 'Last modification time unavailable'
        if lastmod is not None:
            month = lastmod.strftime('%b')
            day = lastmod.strftime('%d')
            day = day[1:] if day[:1] == '0' else day  # strip leading zero
            timestamp = f'{month} {day}, {lastmod.strftime("%Y %H:%M:%S %p %Z")}'
        pen.text((width - 3,  height + 14), timestamp, fill="white", anchor='rs', font=FONT)

        # save image in shared volume
        filename = f'{CAMS_DIR}/{webcam["id"]}.jpg'
        with open(filename, 'wb') as saved:
            stamped.save(saved, 'jpeg', quality=75, exif=raw.getexif())

        # Set the last modified time to the last modified time plus a timedelta
        # calculated mean time between updates, minus the standard
        # deviation.  If that can't be calculated, default to 5 minutes.  This is
        # then used to set the expires header in nginx.
        delta = 300  # 5 minutes
        try:
            mean = webcam.get('update_period_mean')
            stddev = webcam.get('update_period_stddev', 0)
            delta = mean - stddev

        except Exception as e:
            logger.info(e)
            pass  # update period times not available

        delta = datetime.timedelta(seconds=delta)
        if lastmod is not None:
            lastmod = floor((lastmod + delta).timestamp())  # POSIX timestamp
            os.utime(filename, times=(lastmod, lastmod))

    except Exception as e:
        logger.error(e)


# Helper function for add_order_to_cameras that updates order of each cam in a highway/route group
def add_order_to_camera_group(key, cams):
    # Only process if reference linestring exists
    route_geometry = RouteGeometry.objects.filter(id=key).first()
    if route_geometry:
        # Combine all coordinates into a single linestring for sorting
        all_coords = ()
        for route in route_geometry.routes:
            all_coords += route.coords

        # Save distance along route to cams
        route_ls = LineString(all_coords)
        for cam in cams:
            cam.route_distance = route_ls.project(cam.location)

        # Sort cams by distance along route and update
        last_point = None
        current_order = 0
        for sorted_cam in sorted(cams, key=lambda c: (c.route_distance, c.name)):
            # Increase order unless same location as last cam
            if last_point and not sorted_cam.location.equals(last_point):
                current_order += 1

            # Use update here to avoid saving the entire object
            Webcam.objects.filter(id=sorted_cam.id).update(route_order=current_order)

            # Update last cam
            last_point = sorted_cam.location


def add_order_to_cameras():
    """
    DBC22-1183

    Update the order of each camera based on linestrings built by build_route_geometries

    """
    # Sort before grouping by route name
    query = Webcam.objects.all().order_by('highway', 'highway_description')

    # Group by route name and add order to cams in each group
    for route_name, cam_group in groupby(query, lambda x: x.highway if x.highway != '0' else x.highway_description):
        add_order_to_camera_group(route_name, list(cam_group))

    # Rebuild cache
    WebcamAPI().set_list_data()


def build_route_geometries():
    """
    DBC22-1183

    Using hwy_coords for each route as payload to feed into the routing API,
    build linestrings to be used for calculating the distance/order of cameras
    along their route

    """
    for key, routes in hwy_coords.items():
        # Do not build for existing entries
        if not RouteGeometry.objects.filter(id=key).first():
            ls_routes = []

            # Go through each route and create a geometry
            for route in routes:
                payload = {
                    "points": route,
                }

                response = requests.get(
                    env("DRIVEBC_ROUTE_PLANNER_API_BASE_URL") + "/directions.json",
                    params=payload,
                    headers={
                        "apiKey": env("DRIVEBC_ROUTE_PLANNER_API_AUTH_KEY"),
                    }
                )

                points_list = [Point(p) for p in response.json()['route']]
                ls_routes.append(LineString(points_list))

            RouteGeometry.objects.create(id=key, routes=MultiLineString(ls_routes))
