import datetime
from zoneinfo import ZoneInfo

from apps.authentication.models import DriveBCUser, EmailSubscription
from apps.event.enums import (
    EVENT_DIRECTION,
    EVENT_DISPLAY_CATEGORY,
    EVENT_SEVERITY,
    EVENT_STATUS,
    EVENT_SUB_TYPE,
    EVENT_TYPE,
)
from apps.event.models import Event, QueuedDistrictEventNotification
from apps.event.tasks import (
    generate_district_settings_message,
    queue_event_notifications,
    send_queued_district_notifications,
)
from apps.shared.models import Area
from django.contrib.gis.geos import Point, Polygon
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


class SendDistrictNotificationsTest(TestCase):
    def setUp(self):
        self.verified_user = DriveBCUser.objects.create_user(
            username='verifieduser',
            email='verifieduser@example.com',
            password='password',
            verified=True,
            consent=True
        )

        self.unverified_user = DriveBCUser.objects.create_user(
            username='unverifieduser',
            email='unverifieduser@example.com',
            password='password',
            verified=False
        )

        area_geometry = Polygon.from_bbox((0, 0, 1, 1))

        self.area_always = Area.objects.create(
            id=1, name='Always Active Area', geometry=area_geometry
        )
        self.area_day_time = Area.objects.create(
            id=2, name='Day and Time Area', geometry=area_geometry
        )
        self.area_date_time = Area.objects.create(
            id=3, name='Date and Time Range Area', geometry=area_geometry
        )
        self.area_specific_date_time = Area.objects.create(
            id=4, name='Specific Date and Time Area', geometry=area_geometry
        )
        self.area_restricted = Area.objects.create(
            id=5, name='Always Active Minor Area', geometry=area_geometry
        )

        # Case 1: Always active subscription
        self.subscription_always_active = EmailSubscription.objects.create(
            user=self.verified_user,
            area=self.area_always,
            notification=True,
            notification_types=all_display_categories,
            notification_days=[],
            notification_start_date=None,
            notification_end_date=None,
            notification_start_time=None,
            notification_end_time=None
        )

        # Duplicate subscription for unverified user
        EmailSubscription.objects.create(
            user=self.unverified_user,
            area=self.area_always,
            notification=True,
            notification_types=all_display_categories,
            notification_days=[],
            notification_start_date=None,
            notification_end_date=None,
            notification_start_time=None,
            notification_end_time=None
        )

        # Case 2: Subscription matching day of week and time frame
        self.subscription_day_time = EmailSubscription.objects.create(
            user=self.verified_user,
            area=self.area_day_time,
            notification=True,
            notification_types=all_display_categories,
            notification_days=['Monday', 'Tuesday'],
            notification_start_date=None,
            notification_end_date=None,
            notification_start_time=datetime.time(8, 0, tzinfo=ZoneInfo('America/Vancouver')),
            notification_end_time=datetime.time(18, 0, tzinfo=ZoneInfo('America/Vancouver'))
        )

        # Case 3: Subscription matching date period and time frame
        self.subscription_date_time = EmailSubscription.objects.create(
            user=self.verified_user,
            area=self.area_date_time,
            notification=True,
            notification_types=all_display_categories,
            notification_days=[],
            notification_start_date=datetime.date(2023, 10, 10),
            notification_end_date=datetime.date(2023, 10, 20),
            notification_start_time=datetime.time(8, 0, tzinfo=ZoneInfo('America/Vancouver')),
            notification_end_time=datetime.time(18, 0, tzinfo=ZoneInfo('America/Vancouver'))
        )

        # Case 4: Subscription matching specific date and time frame
        self.subscription_specific_date_time = EmailSubscription.objects.create(
            user=self.verified_user,
            area=self.area_specific_date_time,
            notification=True,
            notification_types=all_display_categories,
            notification_days=[],
            notification_start_date=datetime.date(2023, 10, 11),
            notification_end_date=None,
            notification_start_time=datetime.time(8, 0, tzinfo=ZoneInfo('America/Vancouver')),
            notification_end_time=datetime.time(18, 0, tzinfo=ZoneInfo('America/Vancouver'))
        )

        # Case 5: Always active subscription with restricted notification types
        self.subscription_restricted_types = EmailSubscription.objects.create(
            user=self.verified_user,
            area=self.area_restricted,
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
        self.intersecting_event.area.set([
            self.area_always,
            self.area_day_time,
            self.area_date_time,
            self.area_specific_date_time,
        ])

        # Intersecting event with EVENT_DISPLAY_CATEGORY.MINOR_DELAYS
        self.intersecting_event_minor = Event.objects.create(
            id='intersecting_minor',
            description='Intersecting Event Minor',
            event_type=EVENT_TYPE.INCIDENT,
            event_sub_type=EVENT_SUB_TYPE.HAZARD,
            status=EVENT_STATUS.ACTIVE,
            severity=EVENT_SEVERITY.MINOR,
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
        self.intersecting_event_minor.area.set([
            self.area_always,
            self.area_restricted,
        ])

    def test_always_active_subscription(self):
        queue_event_notifications(
            ['intersecting'],
            dt=datetime.datetime(
                2025, 1, 8, 10, 0,
                tzinfo=ZoneInfo('America/Vancouver')
            )
        )

        send_queued_district_notifications()

        # One email for always active subscription
        assert len(mail.outbox) == 1
        email = mail.outbox[0]
        assert 'Always Active Area' in email.subject
        assert 'Intersecting Event' in email.body
        assert 'verifieduser@example.com' in email.to

    def test_queue_merges_event_ids_for_existing_subscription(self):
        dt = datetime.datetime(
            2025, 1, 8, 10, 0,
            tzinfo=ZoneInfo('America/Vancouver')
        )

        queue_event_notifications(['intersecting'], dt=dt)
        queue_event_notifications(['intersecting_minor'], dt=dt)

        queued = QueuedDistrictEventNotification.objects.filter(
            subscription_id=self.subscription_always_active.id
        )
        assert queued.count() == 1
        assert set(queued.first().event_ids) == {'intersecting', 'intersecting_minor'}

        send_queued_district_notifications()

        assert len(mail.outbox) == 2  # always active + restricted types
        always_active_email = next(
            email for email in mail.outbox if 'Always Active Area' in email.subject
        )
        assert '2 updates' in always_active_email.subject
        assert 'Intersecting Event' in always_active_email.body
        assert 'Intersecting Event Minor' in always_active_email.body

    def test_day_and_time_subscription(self):
        queue_event_notifications(
            ['intersecting'],
            dt=datetime.datetime(
                2025, 1, 7, 10, 0,
                tzinfo=ZoneInfo('America/Vancouver')
            )
        )

        send_queued_district_notifications()

        # One email for always active and one for day and time subscription
        assert len(mail.outbox) == 2
        subjects = [email.subject for email in mail.outbox]
        assert any('Always Active Area' in subject for subject in subjects)
        assert any('Day and Time Area' in subject for subject in subjects)

    def test_date_and_time_range_subscription(self):
        queue_event_notifications(
            ['intersecting'],
            dt=datetime.datetime(
                2023, 10, 12, 10, 0,
                tzinfo=ZoneInfo('America/Vancouver')
            )
        )

        send_queued_district_notifications()

        # One email for always active and one for date and time range subscription
        assert len(mail.outbox) == 2
        subjects = [email.subject for email in mail.outbox]
        assert any('Always Active Area' in subject for subject in subjects)
        assert any('Date and Time Range Area' in subject for subject in subjects)

    def test_specific_date_and_time_subscription(self):
        queue_event_notifications(
            ['intersecting'],
            dt=datetime.datetime(
                2023, 10, 11, 10, 0,
                tzinfo=ZoneInfo('America/Vancouver')
            )
        )

        send_queued_district_notifications()

        # One more email for specific date and time subscription
        assert len(mail.outbox) == 3
        subjects = [email.subject for email in mail.outbox]
        assert any('Always Active Area' in subject for subject in subjects)
        assert any('Date and Time Range Area' in subject for subject in subjects)
        assert any('Specific Date and Time Area' in subject for subject in subjects)

    def test_restricted_types(self):
        queue_event_notifications(
            ['intersecting_minor'],
            dt=datetime.datetime(
                2025, 1, 8, 10, 0,
                tzinfo=ZoneInfo('America/Vancouver')
            )
        )

        send_queued_district_notifications()

        # One email for always active and one for restricted types subscription
        assert len(mail.outbox) == 2
        subjects = [email.subject for email in mail.outbox]
        bodies = [email.body for email in mail.outbox]
        assert any('Always Active Area' in subject for subject in subjects)
        assert any('Always Active Minor Area' in subject for subject in subjects)
        assert any('Intersecting Event Minor' in body for body in bodies)

    def test_generate_district_footer_message(self):
        msg = generate_district_settings_message(self.subscription_always_active)
        assert 'Always Active Area' in msg
        assert 'at any time.' in msg
        assert 'in the and' not in msg

        msg = generate_district_settings_message(self.subscription_day_time)
        assert 'Day and Time Area' in msg
        assert 'between' in msg
        assert 'every Monday, Tuesday' in msg

        msg = generate_district_settings_message(self.subscription_date_time)
        assert 'Date and Time Range Area' in msg
        assert 'from October 10 to October 20' in msg

        msg = generate_district_settings_message(self.subscription_specific_date_time)
        assert 'Specific Date and Time Area' in msg
        assert 'on October 11' in msg

    def test_send_only_queued_events_for_subscription(self):
        other_user = DriveBCUser.objects.create_user(
            username='otheruser',
            email='otheruser@example.com',
            password='password',
            verified=True,
            consent=True
        )
        other_subscription = EmailSubscription.objects.create(
            user=other_user,
            area=self.area_always,
            notification=True,
            notification_types=all_display_categories,
        )

        QueuedDistrictEventNotification.objects.create(
            subscription_id=self.subscription_always_active.id,
            event_ids=['intersecting'],
        )
        QueuedDistrictEventNotification.objects.create(
            subscription_id=other_subscription.id,
            event_ids=['intersecting_minor'],
        )

        send_queued_district_notifications()

        assert len(mail.outbox) == 2
        by_recipient = {email.to[0]: email for email in mail.outbox}

        verified_email = by_recipient['verifieduser@example.com']
        other_email = by_recipient['otheruser@example.com']

        assert '1 update' in verified_email.subject
        assert 'Intersecting Event Minor' not in verified_email.body
        assert 'Intersecting Event' in verified_email.body

        assert '1 update' in other_email.subject
        assert 'Intersecting Event Minor' in other_email.body
        assert other_email.body.replace('Intersecting Event Minor', '').count('Intersecting Event') == 0
