import datetime
from zoneinfo import ZoneInfo

from apps.authentication.models import DriveBCUser, SavedRoutes
from apps.event.enums import (
    EVENT_DIRECTION,
    EVENT_DISPLAY_CATEGORY,
    EVENT_SEVERITY,
    EVENT_STATUS,
    EVENT_SUB_TYPE,
    EVENT_TYPE,
)
from apps.event.models import Event
from apps.event.tasks import generate_settings_message, send_event_notifications
from django.contrib.gis.geos import LineString, MultiLineString, Point
from django.core import mail
from django.test import TestCase

all_display_categories = [
    EVENT_DISPLAY_CATEGORY.ADVISORY,
    EVENT_DISPLAY_CATEGORY.CLOSURE,
    EVENT_DISPLAY_CATEGORY.MAJOR_DELAYS,
    EVENT_DISPLAY_CATEGORY.MINOR_DELAYS,
    EVENT_DISPLAY_CATEGORY.FUTURE_DELAYS,
    EVENT_DISPLAY_CATEGORY.ROAD_CONDITION,
    EVENT_DISPLAY_CATEGORY.CHAIN_UP
]


class SendEventNotificationsTest(TestCase):
    def setUp(self):
        self.verified_user = DriveBCUser.objects.create_user(
            username='verifieduser',
            email='verifieduser@example.com',
            password='password',
            verified=True
        )

        self.unverified_user = DriveBCUser.objects.create_user(
            username='unverifieduser',
            email='unverifieduser@example.com',
            password='password',
            verified=False
        )

        # Case 1: Always active route
        self.saved_route_always_active = SavedRoutes.objects.create(
            user=self.verified_user,
            label='Always Active Route',
            start='Start Point',
            start_point=Point(0, 0),
            end='End Point',
            end_point=Point(1, 1),
            route=MultiLineString(LineString((0, 0), (1, 1))),
            notification=True,
            notification_types=all_display_categories,
            notification_days=[],
            notification_start_date=None,
            notification_end_date=None,
            notification_start_time=None,
            notification_end_time=None
        )

        # Duplicate route for unverified user
        self.unverified_route = self.saved_route_always_active
        self.unverified_route.id = 999
        self.unverified_route.label = 'Unverified Always Active Route'
        self.unverified_route.user = self.unverified_user
        self.unverified_route.save()

        # Case 2: Route matching day of week and time frame
        self.saved_route_day_time = SavedRoutes.objects.create(
            user=self.verified_user,
            label='Day and Time Route',
            start='Start Point',
            start_point=Point(0, 0),
            end='End Point',
            end_point=Point(1, 1),
            route=MultiLineString(LineString((0, 0), (1, 1))),
            notification=True,
            notification_types=all_display_categories,
            notification_days=['Monday', 'Tuesday'],
            notification_start_date=None,
            notification_end_date=None,
            notification_start_time=datetime.time(8, 0, tzinfo=ZoneInfo('America/Vancouver')),
            notification_end_time=datetime.time(18, 0, tzinfo=ZoneInfo('America/Vancouver'))
        )

        # Case 3: Route matching date period and time frame
        self.saved_route_date_time = SavedRoutes.objects.create(
            user=self.verified_user,
            label='Date and Time Range Route',
            start='Start Point',
            start_point=Point(0, 0),
            end='End Point',
            end_point=Point(1, 1),
            route=MultiLineString(LineString((0, 0), (1, 1))),
            notification=True,
            notification_types=all_display_categories,
            notification_days=[],
            notification_start_date=datetime.date(2023, 10, 10),
            notification_end_date=datetime.date(2023, 10, 20),
            notification_start_time=datetime.time(8, 0, tzinfo=ZoneInfo('America/Vancouver')),
            notification_end_time=datetime.time(18, 0, tzinfo=ZoneInfo('America/Vancouver'))
        )

        # Case 4: Route matching specific date and time frame
        self.saved_route_specific_date_time = SavedRoutes.objects.create(
            user=self.verified_user,
            label='Specific Date and Time Route',
            start='Start Point',
            start_point=Point(0, 0),
            end='End Point',
            end_point=Point(1, 1),
            route=MultiLineString(LineString((0, 0), (1, 1))),
            notification=True,
            notification_types=all_display_categories,
            notification_days=[],
            notification_start_date=datetime.date(2023, 10, 11),
            notification_end_date=None,
            notification_start_time=datetime.time(8, 0, tzinfo=ZoneInfo('America/Vancouver')),
            notification_end_time=datetime.time(18, 0, tzinfo=ZoneInfo('America/Vancouver'))
        )

        # Case 5: Always active route with restricted notification types
        self.saved_route_restricted_types = SavedRoutes.objects.create(
            user=self.verified_user,
            label='Always Active Minor Route',
            start='Start Point',
            start_point=Point(0, 0),
            end='End Point',
            end_point=Point(1, 1),
            route=MultiLineString(LineString((0, 0), (1, 1))),
            notification=True,
            notification_types=[EVENT_DISPLAY_CATEGORY.MINOR_DELAYS],
            notification_days=[],
            notification_start_date=None,
            notification_end_date=None,
            notification_start_time=None,
            notification_end_time=None
        )

        # Intersecting event with EVENT_DISPLAY_CATEGORY.MAJOR_DELAYS
        self.intersecting_event = Event.objects.create(
            id='intersecting',
            description='Intersecting Event',
            event_type=EVENT_TYPE.INCIDENT,
            event_sub_type=EVENT_SUB_TYPE.HAZARD,
            status=EVENT_STATUS.ACTIVE,
            severity=EVENT_SEVERITY.MAJOR,
            closed=False,
            direction=EVENT_DIRECTION.NORTH,
            location=Point(0.5, 0.5),
            polygon=None,
            route_at='Route 1',
            route_from='Point A',
            route_to='Point B',
            highway_segment_names='Segment 1',
            location_description='Near Point A',
            closest_landmark='Landmark 1',
            next_update=None,
            start_point_linear_reference=0.5,
            first_created=datetime.datetime(2023, 10, 10, 10, 0, tzinfo=ZoneInfo('America/Vancouver')),
            last_updated=datetime.datetime(2023, 10, 10, 10, 0, tzinfo=ZoneInfo('America/Vancouver')),
            schedule={},
            start=datetime.datetime(2023, 10, 10, 10, 0, tzinfo=ZoneInfo('America/Vancouver')),
            end=None
        )

        # Intersecting event with EVENT_DISPLAY_CATEGORY.MINOR_DELAYS
        self.intersecting_event_minor = self.intersecting_event
        self.intersecting_event_minor.id = 'intersecting_minor'
        self.intersecting_event_minor.description = 'Intersecting Event Minor'
        self.intersecting_event_minor.severity = EVENT_SEVERITY.MINOR
        self.intersecting_event_minor.event_type = EVENT_TYPE.INCIDENT
        self.intersecting_event_minor.save()

        # Intersecting event with EVENT_DISPLAY_CATEGORY.MINOR_DELAYS
        self.non_intersecting_event = self.intersecting_event
        self.non_intersecting_event.id = 'non_intersecting'
        self.non_intersecting_event.location = Point(0.5, 0.5)
        self.non_intersecting_event.save()

    def test_always_active_route(self):
        send_event_notifications(
            ['intersecting'],
            dt=datetime.datetime(
                2025, 1, 8, 10, 0,  # Outside all conditional day or date ranges
                tzinfo=ZoneInfo('America/Vancouver')
            )
        )
        assert len(mail.outbox) == 1
        assert 'Always Active Route' in mail.outbox[0].subject
        assert 'Intersecting Event' in mail.outbox[0].body
        assert 'verifieduser@example.com' in mail.outbox[0].to

    def test_day_and_time_route(self):
        send_event_notifications(
            ['intersecting'],
            dt=datetime.datetime(
                2025, 1, 7, 10, 0,  # Tuesday
                tzinfo=ZoneInfo('America/Vancouver')
            )
        )

        assert len(mail.outbox) == 2  # day and time route and always active route
        assert 'Day and Time Route' in mail.outbox[1].subject

    def test_date_and_time_range_route(self):
        send_event_notifications(
            ['intersecting'],
            dt=datetime.datetime(
                2023, 10, 12, 10, 0,  # Within 10/10-10/20
                tzinfo=ZoneInfo('America/Vancouver')
            )
        )

        assert len(mail.outbox) == 2  # date and time route and always active route
        assert 'Date and Time Range Route' in mail.outbox[1].subject

    def test_specific_date_and_time_route(self):
        send_event_notifications(
            ['intersecting'],
            dt=datetime.datetime(
                2023, 10, 11, 10, 0,  # Within 10/10-10/20, exactly 10/11
                tzinfo=ZoneInfo('America/Vancouver')
            )
        )

        assert len(mail.outbox) == 3  # date and time route and always active route
        assert 'Specific Date and Time Route' in mail.outbox[2].subject

    def test_restricted_types(self):
        send_event_notifications(
            ['intersecting_minor'],
            dt=datetime.datetime(
                2025, 1, 8, 10, 0,  # Outside all conditional day or date ranges
                tzinfo=ZoneInfo('America/Vancouver')
            )
        )
        assert len(mail.outbox) == 2  # always active and type restricted routes
        assert 'Always Active Route' in mail.outbox[0].subject
        assert 'Always Active Minor Route' in mail.outbox[1].subject
        assert 'Intersecting Event Minor' in mail.outbox[1].body

    def test_generate_footer_message(self):
        # All notification types
        route = SavedRoutes(notification_types=[
            EVENT_DISPLAY_CATEGORY.ADVISORY,
            EVENT_DISPLAY_CATEGORY.CLOSURE,
            EVENT_DISPLAY_CATEGORY.MAJOR_DELAYS,
            EVENT_DISPLAY_CATEGORY.MINOR_DELAYS,
            EVENT_DISPLAY_CATEGORY.ROAD_CONDITION
        ])
        msg = generate_settings_message(route)
        assert 'all new and updated information ' in msg

        # Two notification types
        route = SavedRoutes(notification_types=[
            EVENT_DISPLAY_CATEGORY.CLOSURE,
            EVENT_DISPLAY_CATEGORY.MAJOR_DELAYS
        ])
        msg = generate_settings_message(route)
        assert 'closures and major delays ' in msg

        # Three notification types
        route = SavedRoutes(notification_types=[
            EVENT_DISPLAY_CATEGORY.CLOSURE,
            EVENT_DISPLAY_CATEGORY.MAJOR_DELAYS,
            EVENT_DISPLAY_CATEGORY.MINOR_DELAYS
        ])
        msg = generate_settings_message(route)
        assert 'closures, major delays, and minor delays ' in msg

        # Any time
        route = SavedRoutes(
            notification_types=[EVENT_DISPLAY_CATEGORY.MAJOR_DELAYS],
        )
        msg = generate_settings_message(route)
        assert 'at any time.' in msg

        # Specific date
        route = SavedRoutes(
            notification_types=[EVENT_DISPLAY_CATEGORY.MAJOR_DELAYS],
            notification_start_time=datetime.time(8, 0),
            notification_end_time=datetime.time(17, 0),
            notification_start_date=datetime.date(2023, 1, 1)
        )
        msg = generate_settings_message(route)
        assert 'on January 01.' in msg

        # Date range - PST
        route = SavedRoutes(
            notification_types=[EVENT_DISPLAY_CATEGORY.MAJOR_DELAYS],
            notification_start_time=datetime.time(8, 0),
            notification_end_time=datetime.time(17, 0),
            notification_start_date=datetime.date(2023, 1, 1),
            notification_end_date=datetime.date(2023, 1, 7)
        )
        msg = generate_settings_message(
            route,
            test_time=datetime.datetime(2023, 1, 3, 0, 0, tzinfo=ZoneInfo('America/Vancouver'))
        )
        assert 'between 08:00am and 05:00pm Pacific Standard Time (PST) ' in msg
        assert 'from January 01 and January 07.' in msg

        # Date range - PDT
        route = SavedRoutes(
            notification_types=[EVENT_DISPLAY_CATEGORY.MAJOR_DELAYS],
            notification_start_time=datetime.time(8, 0),
            notification_end_time=datetime.time(17, 0),
            notification_start_date=datetime.date(2023, 4, 1),
            notification_end_date=datetime.date(2023, 4, 7)
        )
        msg = generate_settings_message(
            route,
            test_time=datetime.datetime(2023, 4, 3, 0, 0, tzinfo=ZoneInfo('America/Vancouver'))
        )
        assert 'between 08:00am and 05:00pm Pacific Daylight Time (PDT) ' in msg
        assert 'from April 01 and April 07.' in msg

        # Days of the week
        route = SavedRoutes(
            notification_types=[EVENT_DISPLAY_CATEGORY.MAJOR_DELAYS],
            notification_start_time=datetime.time(12, 0),
            notification_end_time=datetime.time(23, 0),
            notification_days=['Monday', 'Wednesday', 'Friday']
        )
        msg = generate_settings_message(route)
        assert 'between 12:00pm and 11:00pm ' in msg
        assert 'every Monday, Wednesday, Friday.' in msg

        # Every day
        route = SavedRoutes(
            notification_types=[EVENT_DISPLAY_CATEGORY.MAJOR_DELAYS],
            notification_start_time=datetime.time(8, 0),
            notification_end_time=datetime.time(17, 0),
            notification_days=['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        )
        msg = generate_settings_message(route)
        assert 'every day.' in msg
