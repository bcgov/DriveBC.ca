import csv
import logging
import os
import tempfile
import zipfile

import requests
from apps.feed.client import FeedClient
from apps.ferry.models import (
    CoastalFerryCalendar,
    CoastalFerryRoute,
    CoastalFerryStop,
    CoastalFerryStopTime,
    CoastalFerryTrip,
    Ferry,
)
from apps.ferry.serializers import (
    CoastalFerryCalendarSerializer,
    CoastalFerryRouteSerializer,
    CoastalFerryStopSerializer,
    CoastalFerryStopTimeSerializer,
    CoastalFerryTripSerializer,
    FerrySerializer,
)
from apps.shared.enums import CacheKey
from config import settings
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)


def populate_ferry_from_data(ferry_data):
    vessel_id = ferry_data.get('id')

    try:
        ferry = Ferry.objects.get(id=vessel_id)

    except ObjectDoesNotExist:
        # New ferry obj
        ferry = Ferry(id=vessel_id)

    ferry_serializer = FerrySerializer(ferry, data=ferry_data)
    ferry_serializer.is_valid(raise_exception=True)
    ferry_serializer.save()


def populate_all_ferry_data():
    feed_data = FeedClient().get_ferries_list()['features']

    active_vessel_ids = []
    for ferry_data in feed_data:
        populate_ferry_from_data(ferry_data)

        vessel_id = ferry_data.get('id')
        active_vessel_ids.append(vessel_id)

    # Purge ferries absent in the feed
    Ferry.objects.all().exclude(id__in=active_vessel_ids).delete()

    # Reset
    cache.delete(CacheKey.FERRY_LIST)


def populate_coastal_ferry_data(test_data=None):
    accepted_files = ['routes.txt', 'stops.txt', 'trips.txt', 'stop_times.txt', 'calendar.txt']

    csv_data = test_data or {}
    if not test_data:
        url = settings.DRIVEBC_COSTAL_FERRY_DATA_URL
        response = requests.get(url)
        response.raise_for_status()

        with tempfile.TemporaryDirectory() as tmpdir:
            zip_path = os.path.join(tmpdir, "bcferries.zip")
            with open(zip_path, "wb") as f:
                f.write(response.content)

            with zipfile.ZipFile(zip_path, "r") as zip_ref:
                for file in zip_ref.namelist():
                    if file in accepted_files:
                        zip_ref.extract(file, tmpdir)
                        csv_path = os.path.join(tmpdir, file)
                        with open(csv_path, newline='', encoding='utf-8') as csvfile:
                            reader = csv.DictReader(csvfile)
                            csv_data[file] = list(reader)

    if 'stops.txt' in csv_data:
        populate_coastal_ferry_stops(csv_data['stops.txt'])

    if 'calendar.txt' in csv_data:
        populate_coastal_ferry_calendars(csv_data['calendar.txt'])

    if 'routes.txt' in csv_data:
        populate_coastal_ferry_routes(csv_data['routes.txt'])

    if 'trips.txt' in csv_data:
        populate_coastal_ferry_trips(csv_data['trips.txt'])

    if 'stop_times.txt' in csv_data:
        populate_coastal_ferry_stop_times(csv_data['stop_times.txt'])


def populate_coastal_ferry_stops(stops_data):
    for stop in stops_data:
        stop_id = stop.get('stop_id')
        try:
            coastalStop = CoastalFerryStop.objects.get(id=stop_id)

        except ObjectDoesNotExist:
            # New ferry obj
            coastalStop = CoastalFerryStop(id=stop_id)

        parent_stop_id = stop.get('parent_station', None)

        data = {
            'id': stop_id,
            'name': stop['stop_name'],
            'parent_stop':
                parent_stop_id
                if parent_stop_id and CoastalFerryStop.objects.filter(id=parent_stop_id).exists()
                else None,
            'location': {
                'type': 'Point',
                'coordinates': [float(stop['stop_lon']), float(stop['stop_lat'])]
            }
        }

        coastal_stop_serializer = CoastalFerryStopSerializer(coastalStop, data=data)
        coastal_stop_serializer.is_valid(raise_exception=True)
        coastal_stop_serializer.save()


def populate_coastal_ferry_calendars(calendars_data):
    for calendar in calendars_data:
        calendar_id = calendar.get('service_id')
        try:
            coastalCalendar = CoastalFerryCalendar.objects.get(id=calendar_id)

        except ObjectDoesNotExist:
            # New ferry obj
            coastalCalendar = CoastalFerryCalendar(id=calendar_id)

        active_week_days = ''
        for day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']:
            if calendar.get(day) == '1':
                if active_week_days:
                    active_week_days += ','
                active_week_days += day

        data = {
            'id': calendar_id,
            'name': calendar['service_name'],
            'schedule_start': calendar['start_date'],
            'schedule_end': calendar['end_date'],
            'active_week_days': active_week_days
        }

        coastal_calendar_serializer = CoastalFerryCalendarSerializer(coastalCalendar, data=data)
        coastal_calendar_serializer.is_valid(raise_exception=True)
        coastal_calendar_serializer.save()


def populate_coastal_ferry_routes(routes_data):
    for route in routes_data:
        route_id = route.get('route_id')
        try:
            coastalRoute = CoastalFerryRoute.objects.get(id=route_id)

        except ObjectDoesNotExist:
            # New ferry obj
            coastalRoute = CoastalFerryRoute(id=route_id)

        data = {
            'id': route_id,
            'name': route['route_long_name'],
            'url': route['route_url'],
        }

        coastal_route_serializer = CoastalFerryRouteSerializer(coastalRoute, data=data)
        coastal_route_serializer.is_valid(raise_exception=True)
        coastal_route_serializer.save()


def populate_coastal_ferry_trips(trips_data):
    for trip in trips_data:
        trip_id = trip.get('trip_id')
        try:
            coastalTrip = CoastalFerryTrip.objects.get(id=trip_id)

        except ObjectDoesNotExist:
            # New ferry obj
            coastalTrip = CoastalFerryTrip(id=trip_id)

        data = {
            'id': trip_id,
            'route': trip['route_id'],
            'calendar': trip['service_id'],
        }

        try:
            ferry_serializer = CoastalFerryTripSerializer(coastalTrip, data=data)
            ferry_serializer.is_valid(raise_exception=True)
            ferry_serializer.save()

        # Likely a validation error due to missing route or calendar, continue to next trip
        except ValidationError as e:
            logger.warning(f"Error saving trip {trip_id}: {e}")
            continue


def populate_coastal_ferry_stop_times(stop_times_data):
    for stop_time in stop_times_data:
        trip_id = stop_time.get('trip_id')
        stop_id = stop_time.get('stop_id')

        try:
            coastalStopTime = CoastalFerryStopTime.objects.get(trip__id=trip_id, stop__id=stop_id)

        except ObjectDoesNotExist:
            # New ferry obj
            coastalStopTime = CoastalFerryStopTime(trip_id=trip_id, stop_id=stop_id)

        data = {
            'trip': trip_id,
            'stop': stop_id,
            'stop_time': stop_time['arrival_time'],
            'stop_sequence': stop_time['stop_sequence'],
        }

        try:
            coastal_stop_time_serializer = CoastalFerryStopTimeSerializer(coastalStopTime, data=data)
            coastal_stop_time_serializer.is_valid(raise_exception=True)
            coastal_stop_time_serializer.save()

        except ValidationError as e:
            logger.warning(f"Error saving stop time for trip {trip_id} and stop {stop_id}: {e}")
            continue
