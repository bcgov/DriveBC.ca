import datetime
from zoneinfo import ZoneInfo

from apps.event.enums import EVENT_DISPLAY_CATEGORY, EVENT_SEVERITY
from config import settings


def parse_recurring_datetime(date_string, time_string):
    # Parse the date and time strings into datetime objects
    date = datetime.datetime.strptime(date_string, "%Y-%m-%d").date()
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


def get_site_link(event, route):
    return (
        f'{settings.FRONTEND_BASE_URL}?type=event&display_category={event.display_category}&id={event.id}'
        f'&route_start={route.start}&route_start_point={route.start_point.x},{route.start_point.y}'
        f'&route_end={route.end}&route_end_point={route.end_point.x},{route.end_point.y}'
        f'&route_distance={route.distance}'
    )
