from apps.event.tasks import populate_all_event_data
from apps.webcam.tasks import populate_all_webcam_data, update_all_webcam_data
from huey import crontab
from huey.contrib.djhuey import db_periodic_task


@db_periodic_task(crontab(hour="*/6"))
def populate_webcam_task():
    populate_all_webcam_data()


@db_periodic_task(crontab(minute="*/1"))
def update_camera_task():
    update_all_webcam_data()


@db_periodic_task(crontab(minute="*/5"))
def populate_event_task():
    populate_all_event_data()
