from apps.cms.tasks import populate_all_ferry_data
from apps.event.tasks import populate_all_event_data
from apps.webcam.tasks import populate_all_webcam_data, update_all_webcam_data
from django.core.management import call_command
from huey import crontab
from huey.contrib.djhuey import db_periodic_task
from apps.weather.tasks import populate_all_regional_weather_data

@db_periodic_task(crontab(hour="*/6", minute="0"))
def populate_webcam_task():
    populate_all_webcam_data()


@db_periodic_task(crontab(minute="*/1"))
def update_camera_task():
    update_all_webcam_data()


@db_periodic_task(crontab(minute="*/5"))
def populate_event_task():
    populate_all_event_data()


@db_periodic_task(crontab(hour="*/24", minute="0"))
def populate_ferry_task():
    populate_all_ferry_data()


@db_periodic_task(crontab(minute="*/1"))
def publish_scheduled():
    call_command('publish_scheduled')

@db_periodic_task(crontab(minute="*/5"))
def populate_regional_weather_task():
    populate_all_regional_weather_data()