import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

# Backend dir and env
BACKEND_DIR = Path(__file__).resolve().parents[2]


def parse_and_localize_time_str(time):
    if not time:
        return

    dt = datetime.datetime.strptime(time, "%Y-%m-%d %H:%M:%S")
    localized_dt = dt.replace(tzinfo=ZoneInfo('America/Vancouver'))
    return localized_dt
