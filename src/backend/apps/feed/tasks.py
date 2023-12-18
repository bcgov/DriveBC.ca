from apps.cms.tasks import populate_all_ferry_data
from apps.event.tasks import populate_all_event_data
from apps.webcam.tasks import populate_all_webcam_data, update_all_webcam_data
from django.core.management import call_command
from huey import crontab
from huey.contrib.djhuey import HUEY as HUEY_INSTANCE
from huey.contrib.djhuey import db_periodic_task, lock_task


@db_periodic_task(crontab(hour="*/6"), retries=6, retry_delay=300, priority=20)
@lock_task('populate-cameras')
def populate_webcam_task():
    populate_all_webcam_data()


@db_periodic_task(crontab(minute="*/1"), priority=10)
@lock_task('update-cameras')
def update_camera_task():
    # Do not run when populate task is running
    if not HUEY_INSTANCE.is_locked('populate-cameras'):
        update_all_webcam_data()


@db_periodic_task(crontab(minute="*/5"))
@lock_task('populate-events')
def populate_event_task():
    populate_all_event_data()


@db_periodic_task(crontab(hour="*/24"))
@lock_task('populate-ferries')
def populate_ferry_task():
    populate_all_ferry_data()


@db_periodic_task(crontab(minute="*/1"))
@lock_task('publish-scheduled-cms-objs')
def publish_scheduled():
    call_command('publish_scheduled')
