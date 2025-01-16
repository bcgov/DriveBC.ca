import datetime
from zoneinfo import ZoneInfo


def parse_recurring_datetime(date_string, time_string):
    # Parse the date and time strings into datetime objects
    date = datetime.datetime.strptime(date_string, "%Y-%m-%d").date()
    time = datetime.datetime.strptime(time_string, "%H:%M").time()

    # Combine the date and time into a single datetime object
    dt = datetime.datetime.combine(date, time)

    # Convert the datetime object to Pacific Time and return
    return dt.replace(tzinfo=ZoneInfo('America/Vancouver'))
