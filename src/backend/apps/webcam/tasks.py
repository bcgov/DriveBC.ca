import datetime
import io
import logging
import os
import urllib.request
from urllib.error import HTTPError
from itertools import groupby
from math import floor
from pathlib import Path
from zoneinfo import ZoneInfo

import httpx
from django.conf import settings
from django.contrib.gis.geos import LineString, MultiLineString, Point
from django.core.exceptions import ObjectDoesNotExist
from PIL import Image, ImageDraw, ImageFont

from apps.feed.client import FeedClient
from apps.shared.models import RouteGeometry
from apps.webcam.enums import CAMERA_DIFF_FIELDS
from apps.webcam.hwy_coords import hwy_coords
from apps.webcam.models import Webcam
from apps.webcam.serializers import WebcamSerializer
from apps.webcam.views import WebcamAPI

import aio_pika
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
from datetime import datetime, timezone, timedelta

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
    feed_data = FeedClient().get_webcam_list()["webcams"]

    for webcam_data in feed_data:
        populate_webcam_from_data(webcam_data)

    # Rebuild cache
    WebcamAPI().set_list_data()


def update_single_webcam_data(webcam):
    try:
        webcam_data = FeedClient().get_webcam(webcam)
    except httpx.HTTPStatusError as e:
        # Cam removed/not found, delete it
        if e.response.status_code == 404:
            Webcam.objects.filter(id=webcam.id).delete()

        # Skip updating otherwise
        return

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
        current_time = datetime.datetime.now(tz=ZoneInfo("America/Vancouver"))
        if webcam.should_update(current_time):
            update_single_webcam_data(webcam)

    # Rebuild cache
    WebcamAPI().set_list_data()


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
            logger.info(e)

        if lastmod is not None:
            delta = datetime.timedelta(seconds=delta)
            lastmod = floor((lastmod + delta).timestamp())  # POSIX timestamp
            os.utime(filename, times=(lastmod, lastmod))

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

# Helper function for add_custom_watermark that formats the time difference
def format_time(past_time):
    now = datetime.now(timezone.utc)
    diff = now - past_time

    minutes = int(diff.total_seconds() // 60)
    if minutes < 1:
        return "just now"
    elif minutes == 1:
        return "1 minute ago"
    else:
        return f"{minutes} minutes ago"
    
# Helper function for processing RabbitMQ images
def add_custom_watermark(filename, image_bytes, source_timestamp=None):
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    width, height = image.size

    # New image with space for watermark
    bar_height = 30
    new_image = Image.new("RGB", (width, height + bar_height), (0, 0, 0))
    new_image.paste(image, (0, 0))

    draw = ImageDraw.Draw(new_image)

    # Font settings
    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
    font = ImageFont.truetype(font_path, 16)

    font_path_time = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    font_time = ImageFont.truetype(font_path_time, 16)

    # Generate time
    now = datetime.now(timezone(timedelta(hours=-7)))
    timestamp_str = now.strftime("%a, %b %d, %Y, %-I:%M %p PDT")

    if source_timestamp:
        if isinstance(source_timestamp, (int, float)):
            source_dt = datetime.fromtimestamp(source_timestamp, tz=timezone.utc)
        elif isinstance(source_timestamp, str):
            source_dt = datetime.fromisoformat(source_timestamp.replace("Z", "+00:00"))
        else:
            source_dt = datetime.now(timezone.utc)
    else:
        source_dt = datetime.now(timezone.utc)

    relative_label = format_time(source_dt)

    # Draw DriveBC label
    drivebc_label = "Drive"
    drivebc_suffix = "BC"
    y_pos = height + 5
    draw.text((5, y_pos), drivebc_label, font=font, fill="white")
    drivebc_w = draw.textlength(drivebc_label, font=font)
    draw.text((5 + drivebc_w, y_pos), drivebc_suffix, font=font, fill="orange")

    # Draw timestamp
    ts_w = draw.textlength(timestamp_str, font=font_time)
    draw.text(((width - ts_w) / 2, y_pos), timestamp_str, font=font_time, fill="lightblue")

    # Draw "X minutes ago" on the right
    ago_w = draw.textlength(relative_label, font=font_time)
    draw.text((width - ago_w - 5, y_pos), relative_label, font=font_time, fill="white")

    # Save result
    output_folder = "/tmp/watermarked"
    os.makedirs(output_folder, exist_ok=True)
    output_path = os.path.join(output_folder, f"{filename}")
    new_image.save(output_path)
    logger.info(f"Watermarked image saved to: {output_path}")
    return output_path

async def process_rabbitmq_image():
    rb_url = os.getenv("RABBITMQ_URL")
    if not rb_url:
        raise ValueError("RABBITMQ_URL environment variable is not set")
    rabbitmq_connection = await aio_pika.connect_robust(rb_url)
    channel = await rabbitmq_connection.channel()
    exchange = await channel.declare_exchange(
                name="test.fanout_image_test",
                type=aio_pika.ExchangeType.FANOUT,
                durable=True
            )
    queue = await channel.declare_queue(
        "image-queue-drivebc",
        durable=True,
        exclusive=False,
        auto_delete=False
    )
    
    exchange = await channel.get_exchange("test.fanout_image_test")
    await queue.bind(exchange)

    async with queue.iterator() as queue_iter:
        async for message in queue_iter:
            async with message.process():
                filename = message.headers.get("filename", "unknown.jpg")

                # Save original image
                received_dir = "/tmp/received_images"
                os.makedirs(received_dir, exist_ok=True)
                original_path = f"{received_dir}/{filename}"
                with open(original_path, "wb") as f:
                    f.write(message.body)
                logger.info(f"Original image saved to {original_path}")

                # Save watermarked image
                watermarked_dir = "/tmp/watermarked"
                os.makedirs(watermarked_dir, exist_ok=True)
                watermarked_path = f"{watermarked_dir}/{filename}"
                filename = message.headers.get("filename", "unknown.jpg")
                timestamp_header = message.headers.get("timestamp")

                # Add watermark
                add_custom_watermark(filename, message.body, timestamp_header)