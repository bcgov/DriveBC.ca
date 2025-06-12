from apps.authentication.models import DriveBCUser, SavedRoutes
from apps.cms.models import Advisory
from apps.cms.tasks import send_advisory_notifications
from apps.event.enums import EVENT_DISPLAY_CATEGORY
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import (
    LineString,
    MultiLineString,
    MultiPolygon,
    Point,
    Polygon,
)
from django.core import mail
from django.test import TestCase

display_categories = [
    EVENT_DISPLAY_CATEGORY.ADVISORY
]


class SendAdvisoryNotificationsTest(TestCase):
    def setUp(self):
        super().setUp()

        # Create a verified user
        self.verified_user = DriveBCUser.objects.create_user(
            username='verifieduser',
            email='verifieduser@example.com',
            password='password',
            verified=True
        )

        # Always active route
        self.saved_route_always_active = SavedRoutes.objects.create(
            user=self.verified_user,
            label='Always Active Route',
            start='Start Point',
            start_point=Point(0, 0),
            end='End Point',
            end_point=Point(1, 1),
            route=MultiLineString(LineString((-119, 35), (-119, 30))),
            notification=True,
            notification_types=display_categories,
            notification_days=[],
            notification_start_date=None,
            notification_end_date=None,
            notification_start_time=None,
            notification_end_time=None
        )

    def tearDown(self):
        super().tearDown()
        SavedRoutes.objects.all().delete()
        DriveBCUser.objects.all().delete()
        Advisory.objects.all().delete()

    def test_advisory_notification(self):
        # Create an advisory
        advisory = Advisory(
            title="Advisory title",
            teaser="Test advisory teaser",
            body='[{"id": "1", "type": "rich_text", "value": "Advisory body 1"}]',
            geometry=MultiPolygon(Polygon([(-119, 35), (-118, 32), (-117, 31), (-119, 35)])),
            path="000100010001",
            depth=3,
            content_type=ContentType.objects.get(
                app_label='cms',
                model='advisory'
            ),
        )
        advisory.save()
        send_advisory_notifications(advisory.id)

        # Check that one email was sent
        assert len(mail.outbox) == 1

        # Verify the email contents
        email = mail.outbox[0]
        assert email.subject == 'DriveBC route update: Always Active Route'
        assert advisory.teaser in email.body
        assert email.to == ['verifieduser@example.com']
