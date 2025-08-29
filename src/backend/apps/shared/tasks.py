import datetime
from zoneinfo import ZoneInfo

from apps.event.tasks import update_event_area_relations
from apps.feed.client import FeedClient
from apps.shared.models import Area
from apps.shared.serializers import DistrictSerializer
from apps.webcam.tasks import update_camera_relations
from django.core.exceptions import ObjectDoesNotExist
from email_log.models import Email
from huey import crontab
from huey.contrib.djhuey import db_periodic_task, lock_task


@db_periodic_task(crontab(hour="*/24", minute="0"))
@lock_task("clean-email-logs-lock")
def clean_email_logs():
    current_time = datetime.datetime.now(ZoneInfo("America/Vancouver"))

    # Delete emails older than 7 days
    Email.objects.filter(date_sent__lt=current_time - datetime.timedelta(days=7)).delete()


def populate_district_from_data(district_data):
    district_id = district_data.get('id')

    try:
        district = Area.objects.get(id=district_id)

    except ObjectDoesNotExist:
        # New ferry obj
        district = Area(id=district_id)

    district_serializer = DistrictSerializer(district, data=district_data)
    district_serializer.is_valid(raise_exception=True)
    district_serializer.save()


def populate_all_district_data():
    feed_data = FeedClient().get_district_list()['features']

    for district_data in feed_data:
        populate_district_from_data(district_data)


def update_object_relations():
    update_camera_relations()
    update_event_area_relations()
