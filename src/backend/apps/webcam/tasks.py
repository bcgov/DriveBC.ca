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
from apps.webcam.models import CameraSource
from apps.webcam.serializers import WebcamSerializer
from django.conf import settings
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import LineString, MultiLineString, Point
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import F
from huey.exceptions import CancelExecution
from PIL import Image, ImageDraw, ImageFile, ImageFont
from psycopg import IntegrityError
from apps.shared.status import get_recent_timestamps, calculate_camera_status, parse_timestamp
from apps.consumer.models import ImageIndex
import boto3
# from datetime import timezone
from django.utils import timezone
from django.forms.models import model_to_dict
from django.db.models import F, Case, When, Value, IntegerField
from apps.shared.enums import CacheKey
from django.core.cache import cache

ImageFile.LOAD_TRUNCATED_IMAGES = True

logger = logging.getLogger(__name__)

APP_DIR = Path(__file__).resolve().parent
FONT = ImageFont.truetype(f'{APP_DIR}/static/BCSans.otf', size=14)
FONT_LARGE = ImageFont.truetype(f'{APP_DIR}/static/BCSans.otf', size=24)
CAMS_DIR = f'{settings.SRC_DIR}/images/webcams'

CAM_OFF = ('This highway cam image is currently unavailable due to technical difficulties. '
           'Our technicians have been alerted and service will resume as soon as possible.')

# Environment variables
SQL_DB_SERVER = os.getenv("SQL_DB_SERVER")
SQL_DB_NAME = os.getenv("SQL_DB_NAME")
SQL_DB_USER = os.getenv("SQL_DB_USER")
SQL_DB_PASSWORD = os.getenv("SQL_DB_PASSWORD")
SQL_DB_DRIVER = "ODBC Driver 17 for SQL Server"
S3_BUCKET = os.getenv("S3_BUCKET")
S3_REGION = os.getenv("S3_REGION")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
RABBITMQ_URL = os.getenv("RABBITMQ_URL")
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL")

# Define PVC directory
PVC_WATERMARKED_PATH = os.getenv("PVC_WATERMARKED_PATH")

def populate_webcam_from_data(webcam_data):
    webcam_id = webcam_data.get("id")

    try:
        webcam = Webcam.objects.get(id=webcam_id)

    except ObjectDoesNotExist:
        webcam = Webcam(id=webcam_id)

    # HTTPS cams should only pull updates from SQL, not the legacy feed data.
    current_time = datetime.datetime.now(tz=ZoneInfo("America/Vancouver"))
    if webcam.https_cam:
        update_cam_from_sql_db(webcam.id, current_time)
        return

    webcam_serializer = WebcamSerializer(webcam, data=webcam_data)
    webcam_serializer.is_valid(raise_exception=True)
    webcam_serializer.save()

    update_webcam_image(webcam_data)

def update_webcam_db_stale_delayed(camera: Webcam):
    time_now_utc = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d%H%M%S%f")[:-3]
    camera_status = calculate_camera_status(time_now_utc)
    ts_seconds = int(camera_status["timestamp"])
    dt_utc = datetime.datetime.fromtimestamp(ts_seconds, tz=ZoneInfo("UTC"))

    Webcam.objects.filter(id=camera.id).update(
        marked_stale=camera_status["stale"],
        marked_delayed=camera_status["delayed"],
        last_update_attempt=dt_utc,
        last_update_modified=dt_utc),

def update_cam_from_sql_db(id: int, current_time: datetime.datetime):
    try:
        cam = (
            CameraSource.objects.using("mssql")
            .filter(id=id)
            .annotate(
                region_name=F('cam_locationsregion'),
                highway=F('cam_locationshighway'),
                orientation=F('cam_locationsorientation'),
                elevation=F('cam_locationselevation'),
                isOn=Case(
                    When(cam_controldisabled=False, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField()
                ),
                isOnDemand=F('cam_maintenanceis_on_demand'),
                credit=F('cam_internetcredit'),
                dbc_mark=F('cam_internetdbc_mark'),
                isNew=F('isnew'),
            )
            .values(
                'id',
                'cam_internetname',
                'cam_internetcaption',
                'region_name',
                'highway',
                'orientation',
                'elevation',
                'isOn',
                'isOnDemand',
                'credit',
                'dbc_mark',
                'isNew',
            )
            .first()
        )


        if cam:
            update_webcam_db(id, cam)
            return cam
        else:
            return {}

    except Exception as e:
        logger.error(f"Failed to query camera from ORM: {e}")
        return {}

def format_region_name(region_name):
    if not region_name:
        return region_name

    result = []
    for i, char in enumerate(region_name):
        if i > 0 and char.isupper():
            result.append(' ')
        result.append(char)

    return ''.join(result)

def update_webcam_db(cam_id: int, cam_data: dict):
    timestamp_utc = get_recent_timestamps(cam_id)
    if not timestamp_utc:
        return

    time_now_utc = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d%H%M%S%f")[:-3]
    camera_status = calculate_camera_status(time_now_utc)

    raw_highway = cam_data.get("highway", "")
    updated_count = Webcam.objects.filter(id=cam_id).update(
        region_name=format_region_name(cam_data.get("region_name", "")),
        is_on=True if cam_data.get("isOn") == 1 else False,
        name=cam_data.get("cam_internetname"),
        caption=cam_data.get("cam_internetcaption", ""),
        highway=raw_highway.split("_", 1)[0] if "_" in raw_highway else raw_highway,
        highway_description=raw_highway.split("_", 1)[1] if "_" in raw_highway else "",
        orientation=cam_data.get("orientation", ""),
        elevation=cam_data.get("elevation", 0),
        dbc_mark=cam_data.get("dbc_mark", ""),
        credit=cam_data.get("credit", ""),
        is_new=cam_data.get("isNew", False),
        is_on_demand=cam_data.get("isOnDemand", False),
        update_period_mean=camera_status["mean_interval"],
        update_period_stddev= camera_status["stddev_interval"],
        marked_stale=camera_status["stale"],
        marked_delayed=camera_status["delayed"]
        )
    return updated_count

def purge_old_images():
    logger.info("Purging webcam images...")
    REPLAY_THE_DAY_HOURS = os.getenv("REPLAY_THE_DAY_HOURS")
    purge_old_pvc_images(age=REPLAY_THE_DAY_HOURS)

def backup_purge_old_images():
    backup_purge_old_pvc_images()


def purge_old_pvc_images(age: str = "24"):
    root_path = PVC_WATERMARKED_PATH

    cutoff_time = timezone.now() - datetime.timedelta(hours=int(age))

    records_to_delete_pvc = ImageIndex.objects.filter(
        timestamp__lt=cutoff_time,
    )

    files_to_delete = []
    ids_to_delete = []

    rows = records_to_delete_pvc

    for row in rows:
        # path = row.watermarked_pvc_path
        path = f"{root_path}/{row.camera_id}/{row.timestamp.strftime('%Y%m%d%H%M%S')}.jpg"

        if path:
            full_path = os.path.join(root_path, path)
        else:
            full_path = path

        files_to_delete.append(full_path)
        ids_to_delete.append(row.timestamp)

    ImageIndex.objects.filter(
            timestamp__in=ids_to_delete,
        ).update(
            modified_at=timezone.now()
        )

    # Delete files from PVC or s3
    logger.info(f"Deleting {len(files_to_delete)} old PVC images...")
    for file_path in files_to_delete:
        try:
            if not file_path:
                continue
            os.remove(file_path)
            logger.info(f"Deleted file from PVC: {file_path}")
        except FileNotFoundError:
            logger.error(f"File not found: {file_path}")
        except Exception as e:
            logger.error(f"Error deleting file {file_path}: {e}")

    # Delete all records if all images paths are NULL
    ImageIndex.objects.filter(
        timestamp__in=ids_to_delete,
    ).delete()

    logger.info("All purged recordes are deleted successfully.")

def backup_purge_old_pvc_images():
    PVC_WATERMARKED_PATH = os.getenv("PVC_WATERMARKED_PATH")
    BASE_DIR = Path(PVC_WATERMARKED_PATH)
    logger.info("Starting backup purge of old PVC images...")
    now = time.time()
    cutoff = now - 24 * 60 * 60

    deleted_count = 0
    skipped_count = 0

    for root, dirs, files in os.walk(BASE_DIR):
        for filename in files:
            file_path = Path(root) / filename

            try:
                stat = file_path.stat()
                if stat.st_mtime < cutoff:
                    os.remove(file_path)
                    logger.info(f"Deleted old image: {file_path}")
                    deleted_count += 1
                else:
                    skipped_count += 1
            except Exception as e:
                logger.error(f"Error checking/deleting {file_path}: {e}")

    logger.info(
        f"Backup purge completed. Deleted: {deleted_count}, Skipped (newer): {skipped_count}"
    )
    logger.info("All purged recordes are deleted successfully.")

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
            if not webcam.https_cam:
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
        current_time = datetime.datetime.now(tz=ZoneInfo("America/Vancouver"))
        if camera.https_cam:
            update_cam_from_sql_db(camera.id, current_time)
    cache.delete(CacheKey.WEBCAM_LIST)

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
