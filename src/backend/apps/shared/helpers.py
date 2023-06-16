import datetime

import pytz


def parse_and_localize_time_str(time):
    if not time:
        return

    dt = datetime.datetime.strptime(time, "%Y-%m-%d %H:%M:%S")
    localized_dt = pytz.timezone('America/Vancouver').localize(dt)
    return localized_dt
