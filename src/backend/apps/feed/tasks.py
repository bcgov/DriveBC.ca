from huey import crontab
from huey.contrib.djhuey import db_periodic_task

from apps.webcam.tasks import populate_all_webcams, update_exisitng_webcams


@db_periodic_task(crontab(hour='*/6'))
def populate_webcams_task():
    populate_all_webcams()


@db_periodic_task(crontab(minute='*/1'))
def update_cameras_task():
    update_exisitng_webcams()
