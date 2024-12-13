import datetime
from zoneinfo import ZoneInfo


def parse_and_localize_time_str(time):
    if not time:
        return

    dt = datetime.datetime.strptime(time, "%Y-%m-%d %H:%M:%S")
    localized_dt = dt.replace(tzinfo=ZoneInfo('America/Vancouver'))
    return localized_dt
