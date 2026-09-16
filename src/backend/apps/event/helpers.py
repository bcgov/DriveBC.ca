import datetime
import math
from zoneinfo import ZoneInfo

from apps.event.enums import EVENT_DISPLAY_CATEGORY, EVENT_SEVERITY
from django.conf import settings

# Match frontend Map.jsx View (EPSG:3857, zoomFactor 2.2, min/max zoom 5–15)
_MERCATOR_HALF = 20037508.342789244
_ZOOM_FACTOR = 2.2
_TILE_SIZE = 256
_MIN_ZOOM = 5
_MAX_ZOOM = 15


def get_pan_zoom_for_geometry(geometry, map_size=1024, padding=0.15):
    """
    Return (pan_lon, pan_lat, zoom) fitted to geometry extent.

    Mirrors frontend fitMap for route notifications; used for area extent too.
    """
    if geometry is None or geometry.empty:
        return None

    extent = geometry.extent  # xmin, ymin, xmax, ymax
    pan_lon = (extent[0] + extent[2]) / 2
    pan_lat = (extent[1] + extent[3]) / 2

    geom_3857 = geometry.clone()
    if geom_3857.srid and geom_3857.srid != 3857:
        geom_3857.transform(3857)
    elif not geom_3857.srid:
        geom_3857.srid = 4326
        geom_3857.transform(3857)

    xmin, ymin, xmax, ymax = geom_3857.extent
    width = (xmax - xmin) * (1 + padding)
    height = (ymax - ymin) * (1 + padding)
    size = max(width, height, 1.0)

    max_resolution = 2 * _MERCATOR_HALF / _TILE_SIZE
    target_resolution = size / map_size
    zoom = math.log(max_resolution / target_resolution) / math.log(_ZOOM_FACTOR)
    zoom = max(_MIN_ZOOM, min(_MAX_ZOOM, zoom))

    return pan_lon, pan_lat, zoom


def build_event_site_link(event, geometry=None, route=None):
    """Full DriveBC map URL for an event, with pan/zoom from geometry or route extent."""
    link = (
        f'{settings.FRONTEND_BASE_URL}?type=event'
        f'&display_category={event.display_category}&id={event.id}'
    )

    if route is not None:
        link += (
            f'&route_start={route.start}'
            f'&route_start_point={route.start_point.x},{route.start_point.y}'
            f'&route_end={route.end}'
            f'&route_end_point={route.end_point.x},{route.end_point.y}'
            f'&route_distance={route.distance}'
        )
        if geometry is None:
            geometry = route.route

    pan_zoom = get_pan_zoom_for_geometry(geometry)
    if pan_zoom:
        pan_lon, pan_lat, zoom = pan_zoom
        link += f'&pan={pan_lon},{pan_lat}&zoom={zoom}'

    return link


def parse_recurring_datetime(date_string, time_string):
    # Parse the date and time strings into datetime objects
    stripped_date_string = date_string.split("T")[0]
    date = datetime.datetime.strptime(stripped_date_string, "%Y-%m-%d").date()
    time = datetime.datetime.strptime(time_string, "%H:%M").time()

    # Combine the date and time into a single datetime object
    dt = datetime.datetime.combine(date, time)

    # Convert the datetime object to Pacific Time and return
    return dt.replace(tzinfo=ZoneInfo('America/Vancouver'))


def get_display_category(event, test_datetime=None):
    current_datetime = test_datetime if test_datetime else datetime.datetime.now(ZoneInfo('UTC'))
    if event.start and current_datetime < event.start:
        return EVENT_DISPLAY_CATEGORY.FUTURE_DELAYS

    if 'recurring_schedules' in event.schedule and len(event.schedule['recurring_schedules']):
        recurring_schedules = event.schedule['recurring_schedules'][0]
        start_datetime = parse_recurring_datetime(
            recurring_schedules['start_date'],
            recurring_schedules['daily_start_time']
        )

        if current_datetime < start_datetime:
            return EVENT_DISPLAY_CATEGORY.FUTURE_DELAYS

    if event.closed:
        return EVENT_DISPLAY_CATEGORY.CLOSURE

    if event.event_type == 'ROAD_CONDITION' or event.event_type == 'WEATHER_CONDITION':
        return EVENT_DISPLAY_CATEGORY.ROAD_CONDITION
    elif event.event_type == 'CHAIN_UP':
        return EVENT_DISPLAY_CATEGORY.CHAIN_UP

    return EVENT_DISPLAY_CATEGORY.MAJOR_DELAYS \
        if event.severity == EVENT_SEVERITY.MAJOR \
        else EVENT_DISPLAY_CATEGORY.MINOR_DELAYS
