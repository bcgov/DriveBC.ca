import datetime
import io
import logging
import os
import socket
import time
import urllib.request
from collections import Counter
from itertools import groupby
from math import floor
from pathlib import Path
from urllib.error import HTTPError
from zoneinfo import ZoneInfo

import httpx
from apps.event.enums import EVENT_DISPLAY_CATEGORY
from apps.event.models import Event
from apps.feed.client import FeedClient
from apps.shared.models import Area, RouteGeometry
from apps.weather.models import CurrentWeather, HighElevationForecast, RegionalWeather
from apps.webcam.enums import CAMERA_DIFF_FIELDS, CAMERA_TASK_DEFAULT_TIMEOUT
from apps.webcam.hwy_coords import hwy_coords
from apps.webcam.models import Webcam
from apps.webcam.serializers import WebcamSerializer
from django.conf import settings
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import LineString, MultiLineString, Point
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import F
from huey.exceptions import CancelExecution
from PIL import Image, ImageDraw, ImageFile, ImageFont
from psycopg import IntegrityError

ImageFile.LOAD_TRUNCATED_IMAGES = True

logger = logging.getLogger(__name__)

APP_DIR = Path(__file__).resolve().parent
FONT = ImageFont.truetype(f'{APP_DIR}/static/BCSans.otf', size=14)
FONT_LARGE = ImageFont.truetype(f'{APP_DIR}/static/BCSans.otf', size=24)
CAMS_DIR = f'{settings.SRC_DIR}/images/webcams'

CAM_OFF = ('This highway cam image is currently unavailable due to technical difficulties. '
           'Our technicians have been alerted and service will resume as soon as possible.')


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
    start_time = time.time()

    feed_data = FeedClient().get_webcam_list()["webcams"]
    for webcam_data in feed_data:
        # Check if the task has timed out at the start of each iteration
        if time.time() - start_time > CAMERA_TASK_DEFAULT_TIMEOUT:
            logger.warning(f"populate_all_webcam_data stopped: exceeded {CAMERA_TASK_DEFAULT_TIMEOUT} seconds.")
            raise CancelExecution()

        populate_webcam_from_data(webcam_data)


def update_single_webcam_data(webcam):
    try:
        webcam_data = FeedClient().get_webcam(webcam)
    except httpx.HTTPStatusError as e:
        # Cam removed/not found, delete it
        if e.response.status_code == 404:
            Webcam.objects.filter(id=webcam.id).delete()

        # Skip updating otherwise
        return False

    # Only update if existing data differs for at least one of the fields
    for field in CAMERA_DIFF_FIELDS:
        if getattr(webcam, field) != webcam_data[field]:
            webcam_serializer = WebcamSerializer(webcam, data=webcam_data)
            webcam_serializer.is_valid(raise_exception=True)
            webcam_serializer.save()
            update_webcam_image(webcam_data)
            return True


def update_all_webcam_data():
    start_time = time.time()
    for camera in Webcam.objects.all():
        # Check if the task has timed out at the start of each iteration
        if time.time() - start_time > CAMERA_TASK_DEFAULT_TIMEOUT:
            logger.warning(f"update_all_webcam_data stopped: exceeded {CAMERA_TASK_DEFAULT_TIMEOUT} seconds.")
            raise CancelExecution()

        current_time = datetime.datetime.now(tz=ZoneInfo("America/Vancouver"))
        if camera.should_update(current_time):
            updated = update_single_webcam_data(camera)
            if updated:
                update_camera_group_id(camera)


def wrap_text(text, pen, font, width):
    '''
    Return text wrapped to width with newlines

    `pen` is the drawing context on the image; `font` is the font used for
    drawing the text at a specific size. `width` is specified in pixels.

    The text is split on whitespace into tokens.  The length of the token is
    calculated with a space at the end, and if the cumulative length of the line
    exceeds width, a newline is inserted and the linelength reset to 0 for the
    next line.  The token (with a space at the end) is then added to the end of
    the returning list.

    When a newline condition is detected, the space is removed from the prior
    token in the returning list so that centering the text doesn't include a
    trailing space on each line.  The last token also has a space stripped.
    '''

    line_length = 0
    out = []

    for token in text.split():
        token_width = pen.textlength(token + ' ', font=font)

        if line_length + token_width > width:
            if len(out) > 0:  # remove added space from end of prior token
                out[-1] = out[-1][:-1]
            out.append('\n')
            line_length = 0

        out.append(token + ' ')
        line_length += token_width

    if len(out) > 0:  # remove added space from end of last token
        out[-1] = out[-1][:-1]

    return ''.join(out)


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

        logger.info(f"Requesting GET {endpoint}")
        with urllib.request.urlopen(endpoint, timeout=10) as url:
            image_data = io.BytesIO(url.read())

        raw = Image.open(image_data)
        width, height = raw.size
        if width > 800:
            ratio = 800 / width
            width = 800
            height = floor(height * ratio)
            raw = raw.resize((width, height))

        stamped = Image.new('RGB', (width, height + 18))
        pen = ImageDraw.Draw(stamped)
        lastmod = webcam.get('last_update_modified')

        if webcam.get('is_on'):
            stamped.paste(raw)  # leaves 18 pixel black bar left at bottom

            timestamp = 'Last modification time unavailable'
            if lastmod is not None:
                month = lastmod.strftime('%b')
                day = lastmod.strftime('%d')
                day = day[1:] if day[:1] == '0' else day  # strip leading zero
                timestamp = f'{month} {day}, {lastmod.strftime("%Y %H:%M:%S %p %Z")}'

            pen.text((width - 3,  height + 14), timestamp, fill="white",
                     anchor='rs', font=FONT)

        else:  # camera is unavailable, replace image with message
            message = webcam.get('message', {}).get('long')
            wrapped = wrap_text(message, pen, FONT_LARGE, min(width - 40, 500))
            bbox = pen.multiline_textbbox((0, 0), wrapped, font=FONT_LARGE)
            x = (width - bbox[2]) / 2
            pen.multiline_text((x, 20), wrapped, fill="white", align='center',
                               font=FONT_LARGE)
            pen.polygon(((0, height), (width, height),
                         (width, height + 18), (0, height + 18)),
                        fill="red")

        # add mark and timestamp to black bar
        mark = webcam.get('dbc_mark', '')
        pen.text((3,  height + 14), mark, fill="white", anchor='ls', font=FONT)

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
            logger.exception(e)

        if lastmod is not None:
            delta = datetime.timedelta(seconds=delta)
            lastmod = floor((lastmod + delta).timestamp())  # POSIX timestamp
            os.utime(filename, times=(lastmod, lastmod))

    except socket.timeout as e:
        logger.error(f'Timeout fetching webcam image for camera {webcam["id"]}: {e}')

    except HTTPError as e:  # log HTTP errors without stacktrace to reduce log noise
        logger.error(f'{e} on {endpoint}')

    except Exception as e:
        logger.exception(e)


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
            try:
                cam.route_distance = route_ls.project(cam.location)
            except Exception as e:
                logger.warning(f"Error projecting cam {cam.id} on route {key}: {e}")
                cam.route_distance = 0

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


def reverse_ls_routes(ls_routes):
    """
    Reverse a list of linestrings and all their points

    """
    res = ls_routes[::-1]
    return [LineString(ls[::-1]) for ls in res]


def build_route_geometries(coords=hwy_coords):
    """
    DBC22-1183

    Using hwy_coords for each route as payload to feed into the routing API,
    build linestrings to be used for calculating the distance/order of cameras
    along their route

    """
    for key, routes in coords.items():
        ls_routes = []

        # Go through each route and create a geometry
        for route in routes:
            payload = {
                "points": route,
            }

            response = httpx.get(
                settings.DRIVEBC_ROUTE_PLANNER_API_BASE_URL + "/directions.json",
                params=payload,
                headers={
                    "apiKey": settings.DRIVEBC_ROUTE_PLANNER_API_AUTH_KEY,
                }
            )

            points_list = [Point(p) for p in response.json()['route']]
            ls_routes.append(LineString(points_list))

        # DBC22-2456
        highways_to_reverse = [
            '2', '3B', '9', '11', '13', '15', '17A', '23',
            '27', '29', '31', '33', '35', '37', '43', '91A',
            '93', '95', '97', '97C'
        ]

        if key in highways_to_reverse:
            ls_routes = reverse_ls_routes(ls_routes)

        # Save or update
        if not RouteGeometry.objects.filter(id=key).first():
            RouteGeometry.objects.create(id=key, routes=MultiLineString(ls_routes))

        else:
            RouteGeometry.objects.filter(id=key).update(routes=MultiLineString(ls_routes))


# DBC22-4679 find and update the nearest weather stations for a camera
def update_camera_weather_station(camera, weather_class):
    meters_in_degrees = 0.000008983152841195  # 1 meter in degrees at the equator

    stations_qs = weather_class.objects.filter(
        location__dwithin=(camera.location, 30000 * meters_in_degrees),  # 30km in degrees
        elevation__lte=camera.elevation + 300,
        elevation__gte=camera.elevation - 300,  # within 300m elevation,
    ) if isinstance(weather_class, CurrentWeather) else weather_class.objects.all()

    closest_station = stations_qs.annotate(
        distance=Distance('location', camera.location)
    ).order_by('distance').first()

    if closest_station:
        if weather_class == CurrentWeather:
            Webcam.objects.filter(id=camera.id).update(local_weather_station=closest_station)

        elif weather_class == RegionalWeather:
            Webcam.objects.filter(id=camera.id).update(regional_weather_station=closest_station)

        elif weather_class == HighElevationForecast:
            Webcam.objects.filter(id=camera.id).update(hev_station=closest_station)


def update_camera_relations():
    for area in Area.objects.all():
        Webcam.objects.filter(location__within=area.geometry).update(area=area)

    for camera in Webcam.objects.all():
        update_camera_weather_station(camera, RegionalWeather)
        update_camera_weather_station(camera, CurrentWeather)
        update_camera_weather_station(camera, HighElevationForecast)


def update_camera_group_id(camera):
    try:
        group_id = Webcam.objects.filter(location=camera.location).order_by('id').first().id
        Webcam.objects.filter(id=camera.id).update(group_id=group_id)  # update without triggering save

    except IntegrityError as e:
        logger.warning(f"Error updating group id for camera {camera.id}: {e}")


def update_all_camera_group_ids(*args, **kwargs):
    for camera in Webcam.objects.all():
        update_camera_group_id(camera)


def get_nearby_queryset(model, obj):
    meters_in_degrees = 0.000008983152841195  # 1 meter in degrees at the equator
    return model.objects.filter(
        location__dwithin=(obj.location, 3000*meters_in_degrees),
    ).exclude(
        location__dwithin=(obj.location, 10*meters_in_degrees)
    )


def update_camera_nearby_objs():
    # Iterate through "parent" webcams and update their nearby objects count
    for parent_cam in Webcam.objects.filter(id=F('group_id')):
        nearby_cams_count = get_nearby_queryset(Webcam, parent_cam).distinct('location').count()

        nearby_events = get_nearby_queryset(Event, parent_cam).values_list('display_category', flat=True)
        event_counts = Counter(nearby_events)

        nearby_local_weathers = get_nearby_queryset(CurrentWeather, parent_cam).count()
        nearby_regional_weathers = get_nearby_queryset(RegionalWeather, parent_cam).count()
        nearby_hev_weathers = get_nearby_queryset(HighElevationForecast, parent_cam).count()

        nearby_objs = {
            "cameras": nearby_cams_count,
            EVENT_DISPLAY_CATEGORY.CLOSURE: event_counts[EVENT_DISPLAY_CATEGORY.CLOSURE],
            EVENT_DISPLAY_CATEGORY.MAJOR_DELAYS: event_counts[EVENT_DISPLAY_CATEGORY.MAJOR_DELAYS],
            EVENT_DISPLAY_CATEGORY.MINOR_DELAYS: event_counts[EVENT_DISPLAY_CATEGORY.MINOR_DELAYS],
            EVENT_DISPLAY_CATEGORY.FUTURE_DELAYS: event_counts[EVENT_DISPLAY_CATEGORY.FUTURE_DELAYS],
            EVENT_DISPLAY_CATEGORY.ROAD_CONDITION: event_counts[EVENT_DISPLAY_CATEGORY.ROAD_CONDITION],
            EVENT_DISPLAY_CATEGORY.CHAIN_UP: event_counts[EVENT_DISPLAY_CATEGORY.CHAIN_UP],
            'weather': nearby_regional_weathers + nearby_local_weathers + nearby_hev_weathers,
        }

        Webcam.objects.filter(id=parent_cam.id).update(nearby_objs=nearby_objs)

    for child_cam in Webcam.objects.exclude(id=F('group_id')):
        parent_cam = child_cam.group
        if parent_cam:
            Webcam.objects.filter(id=child_cam.id).update(
                nearby_objs=parent_cam.nearby_objs
            )
