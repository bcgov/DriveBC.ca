import datetime
import logging
import zoneinfo

import requests
from apps.border.enums import LANE_DIRECTION, LANE_TYPE
from apps.border.models import BorderCrossing, BorderCrossingLanes
from config import settings

logger = logging.getLogger(__name__)


def populate_border_crossings(testing=False):
    # Create border crossings if none exist
    if BorderCrossing.objects.all().count() == 0:
        BorderCrossing.objects.create(id=134, name='Peace Arch', location='POINT(-122.755215373302 49.0004903332751)')
        BorderCrossingLanes.objects.create(
            id=4, border_crossing_id=134, lane_type=LANE_TYPE.CARS, lane_direction=LANE_DIRECTION.SOUTHBOUND
        )
        BorderCrossingLanes.objects.create(
            id=5, border_crossing_id=134, lane_type=LANE_TYPE.CARS, lane_direction=LANE_DIRECTION.NORTHBOUND
        )
        BorderCrossingLanes.objects.create(
            id=6, border_crossing_id=134, lane_type=LANE_TYPE.NEXUS, lane_direction=LANE_DIRECTION.NORTHBOUND
        )
        BorderCrossingLanes.objects.create(
            id=11, border_crossing_id=134, lane_type=LANE_TYPE.NEXUS, lane_direction=LANE_DIRECTION.SOUTHBOUND
        )

        BorderCrossing.objects.create(id=135, name='Pacific Highway', location='POINT(-122.735322148821 49.0040969132511)')
        BorderCrossingLanes.objects.create(
            id=3, border_crossing_id=135, lane_type=LANE_TYPE.CARS, lane_direction=LANE_DIRECTION.SOUTHBOUND
        )
        BorderCrossingLanes.objects.create(
            id=8, border_crossing_id=135, lane_type=LANE_TYPE.FAST, lane_direction=LANE_DIRECTION.SOUTHBOUND
        )
        BorderCrossingLanes.objects.create(
            id=9, border_crossing_id=135, lane_type=LANE_TYPE.NEXUS, lane_direction=LANE_DIRECTION.SOUTHBOUND
        )
        BorderCrossingLanes.objects.create(
            id=10, border_crossing_id=135, lane_type=LANE_TYPE.TRUCKS, lane_direction=LANE_DIRECTION.SOUTHBOUND
        )
        BorderCrossingLanes.objects.create(
            id=13, border_crossing_id=135, lane_type=LANE_TYPE.CARS, lane_direction=LANE_DIRECTION.NORTHBOUND
        )
        BorderCrossingLanes.objects.create(
            id=14, border_crossing_id=135, lane_type=LANE_TYPE.NEXUS, lane_direction=LANE_DIRECTION.NORTHBOUND
        )
        BorderCrossingLanes.objects.create(
            id=16, border_crossing_id=135, lane_type=LANE_TYPE.TRUCKS, lane_direction=LANE_DIRECTION.NORTHBOUND
        )
        BorderCrossingLanes.objects.create(
            id=17, border_crossing_id=135, lane_type=LANE_TYPE.FAST, lane_direction=LANE_DIRECTION.NORTHBOUND
        )

        BorderCrossing.objects.create(id=136, name='Lynden/Aldergrove', location='POINT(-122.485026353147 49.0004223841645)')
        BorderCrossingLanes.objects.create(
            id=12, border_crossing_id=136, lane_type=LANE_TYPE.CARS, lane_direction=LANE_DIRECTION.NORTHBOUND
        )
        BorderCrossingLanes.objects.create(
            id=611, border_crossing_id=136, lane_type=LANE_TYPE.CARS, lane_direction=LANE_DIRECTION.SOUTHBOUND
        )
        BorderCrossingLanes.objects.create(
            id=749, border_crossing_id=136, lane_type=LANE_TYPE.TRUCKS, lane_direction=LANE_DIRECTION.SOUTHBOUND
        )
        BorderCrossingLanes.objects.create(
            id=753, border_crossing_id=136, lane_type=LANE_TYPE.TRUCKS, lane_direction=LANE_DIRECTION.NORTHBOUND
        )
        BorderCrossingLanes.objects.create(
            id=758, border_crossing_id=136, lane_type=LANE_TYPE.NEXUS, lane_direction=LANE_DIRECTION.NORTHBOUND
        )

        BorderCrossing.objects.create(id=137, name='Sumas/Huntingdon', location='POINT(-122.265219 49.004678)')
        BorderCrossingLanes.objects.create(
            id=15, border_crossing_id=137, lane_type=LANE_TYPE.CARS, lane_direction=LANE_DIRECTION.NORTHBOUND
        )
        BorderCrossingLanes.objects.create(
            id=610, border_crossing_id=137, lane_type=LANE_TYPE.CARS, lane_direction=LANE_DIRECTION.SOUTHBOUND
        )
        BorderCrossingLanes.objects.create(
            id=754, border_crossing_id=137, lane_type=LANE_TYPE.TRUCKS, lane_direction=LANE_DIRECTION.NORTHBOUND
        )
        BorderCrossingLanes.objects.create(
            id=756, border_crossing_id=137, lane_type=LANE_TYPE.NEXUS, lane_direction=LANE_DIRECTION.NORTHBOUND
        )

    for lane in BorderCrossingLanes.objects.all().order_by("id"):
        lane_delay_endpoint = settings.DRIVEBC_BORDER_CROSSING_LANE_DELAY_BASE_URL + f"/{lane.id}?format=json"

        try:
            response = requests.get(lane_delay_endpoint)
            lane_delay_data = response.json()

            # Workaround for unix time in pacific time
            last_updated_unix = lane_delay_data.get("GroupStarts")[0]
            last_updated_converted = datetime.datetime.fromtimestamp(last_updated_unix, tz=zoneinfo.ZoneInfo(key="UTC"))
            last_updated_replaced = last_updated_converted.replace(tzinfo=zoneinfo.ZoneInfo(key="America/Vancouver"))
            lane.last_updated = last_updated_replaced

            delay_minutes = lane_delay_data.get("Values")[0][0]
            lane.delay_minutes = delay_minutes
            lane.save()

        except Exception as e:
            logger.warning(f"Error making API call for lane {lane.id}: {e}")

        # run only once in unit tests
        if testing:
            return
