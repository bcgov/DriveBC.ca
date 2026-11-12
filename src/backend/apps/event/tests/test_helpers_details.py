import datetime

from apps.event.helpers import (
    get_in_effect_items,
    get_schedule_text,
    get_traffic_impact_items,
)
from apps.event.models import Event
from django.test import SimpleTestCase

WEEKDAYS = {'mon': True, 'tue': True, 'wed': True, 'thu': True, 'fri': True, 'sat': False, 'sun': False}
UTC = datetime.timezone.utc


class EventDetailHelpersTest(SimpleTestCase):
    def test_schedule_text_day_ranges(self):
        assert get_schedule_text({**WEEKDAYS, 'startTime': '07:00', 'endTime': '17:30'}) == \
            'Monday to Friday, 7:00 am to 5:30 pm'
        assert get_schedule_text({'mon': True, 'wed': True, 'sat': True, 'sun': True, 'allDay': True}) == \
            'Monday, Wednesday, Saturday, Sunday, all day'
        assert get_schedule_text({day: True for day in WEEKDAYS} | {'endTime': '06:00'}) == \
            'Every day, until 6:00 am'

    def test_in_effect_until_end(self):
        event = Event(
            start=datetime.datetime(2020, 1, 1, tzinfo=UTC),
            end=datetime.datetime(2025, 9, 9, 19, 5, tzinfo=UTC),
            timezone='America/Vancouver',
        )

        assert get_in_effect_items(event) == ['Until 12:05 pm on Tuesday, September 9, 2025']

    def test_in_effect_future_start_with_schedule(self):
        event = Event(
            start=datetime.datetime(2099, 1, 1, 16, tzinfo=UTC),
            schedules=[{**WEEKDAYS, 'startTime': '09:00', 'endTime': '15:00'}],
        )

        assert get_in_effect_items(event) == [
            'From 9:00 am on Thursday, January 1, 2099 until further notice',
            'Monday to Friday, 9:00 am to 3:00 pm',
        ]

    def test_in_effect_hidden_for_ongoing_incident(self):
        assert get_in_effect_items(Event(start=datetime.datetime(2020, 1, 1, tzinfo=UTC))) == []

    def test_traffic_impact_singular_delay_unit(self):
        event = Event(delay_amount=2, delay_unit='hours', impacts=[{'label': 'Both lanes closed'}])

        assert get_traffic_impact_items(event) == ['Estimated 2 hour delay', 'Both lanes closed']
