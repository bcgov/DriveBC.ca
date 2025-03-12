import datetime
import logging
import zoneinfo

import requests
from apps.border.models import BorderCrossingLanes
from config import settings

logger = logging.getLogger(__name__)


def update_border_crossing_lanes(testing=False):
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
