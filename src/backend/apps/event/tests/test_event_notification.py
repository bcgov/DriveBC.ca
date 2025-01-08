from apps.authentication.models import DriveBCUser, SavedRoutes
from apps.event.models import Event
from apps.event.tasks import send_event_notifications
from django.contrib.gis.geos import LineString, MultiLineString, Point
from django.core import mail
from django.test import TestCase


class SendEventNotificationsTest(TestCase):
    def setUp(self):
        self.verified_user = DriveBCUser.objects.create_user(
            username='verifieduser',
            email='verifieduser@example.com',
            password='password',
            verified=True
        )
        self.non_verified_user = DriveBCUser.objects.create_user(
            username='nonverifieduser',
            email='nonverifieduser@example.com',
            password='password',
            verified=False
        )
        self.saved_route_verified = SavedRoutes.objects.create(
            user=self.verified_user,
            label='Verified Route',
            start='Start Point',
            start_point=Point(0, 0),
            end='End Point',
            end_point=Point(1, 1),
            route=MultiLineString(LineString((0, 0), (1, 1))),
            notification=True
        )
        self.saved_route_non_verified = SavedRoutes.objects.create(
            user=self.non_verified_user,
            label='Non-Verified Route',
            start='Start Point',
            start_point=Point(0, 0),
            end='End Point',
            end_point=Point(1, 1),
            route=MultiLineString(LineString((0, 0), (1, 1))),
            notification=True
        )
        self.saved_route_notification_off = SavedRoutes.objects.create(
            user=self.non_verified_user,
            label='Non-Toggled Route',
            start='Start Point',
            start_point=Point(0, 0),
            end='End Point',
            end_point=Point(1, 1),
            route=MultiLineString(LineString((0, 0), (1, 1))),
            notification=False
        )
        self.intersecting_event = Event.objects.create(
            id='intersecting',
            description='Intersecting Event',
            event_type='Accident',
            event_sub_type='Minor',
            status='Active',
            severity='High',
            closed=False,
            direction='North',
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
            first_created='2023-10-10 10:00:00',
            last_updated='2023-10-10 10:00:00',
            schedule={},
            start='2023-10-10 10:00:00',
            end=None
        )
        self.non_intersecting_event = Event.objects.create(
            id='nonintersecting',
            description='Non-Intersecting Event',
            event_type='Construction',
            event_sub_type='Major',
            status='Planned',
            severity='Medium',
            closed=False,
            direction='South',
            location=Point(2, 2),
            polygon=None,
            route_at='Route 2',
            route_from='Point C',
            route_to='Point D',
            highway_segment_names='Segment 2',
            location_description='Near Point C',
            closest_landmark='Landmark 2',
            next_update=None,
            start_point_linear_reference=2.0,
            first_created='2023-10-10 10:00:00',
            last_updated='2023-10-10 10:00:00',
            schedule={},
            start='2023-10-10 10:00:00',
            end=None
        )
        self.non_updated_event = Event.objects.create(
            id='nonupdated',
            description='Non-Updated Event',
            event_type='Accident',
            event_sub_type='Major',
            status='Active',
            severity='Low',
            closed=False,
            direction='East',
            location=Point(0.5, 0.5),
            polygon=None,
            route_at='Route 3',
            route_from='Point E',
            route_to='Point F',
            highway_segment_names='Segment 3',
            location_description='Near Point E',
            closest_landmark='Landmark 3',
            next_update=None,
            start_point_linear_reference=0.5,
            first_created='2023-10-10 10:00:00',
            last_updated='2023-10-10 10:00:00',
            schedule={},
            start='2023-10-10 10:00:00',
            end=None
        )

    def test_send_event_notifications_with_intersecting_events_to_verified_users(self):
        send_event_notifications(['intersecting', 'nonintersecting'])  # Non-updated event is not in the list
        assert len(mail.outbox) == 1
        assert 'Verified Route' in mail.outbox[0].subject
        assert 'Non-Verified Route' not in mail.outbox[0].subject
        assert 'Non-Toggled Route' not in mail.outbox[0].subject
        assert 'Intersecting Event' in mail.outbox[0].body
        assert 'Non-Intersecting Event' not in mail.outbox[0].body
        assert 'Non-Updated Event' not in mail.outbox[0].body
        assert 'verifieduser@example.com' in mail.outbox[0].to
        assert 'nonverifieduser@example.com' not in mail.outbox[0].to
