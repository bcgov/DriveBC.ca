import datetime

from apps.cms.tasks import populate_all_ferry_data
from apps.event.tasks import populate_all_event_data
from apps.rest.tasks import populate_all_rest_stop_data
from apps.weather.tasks import (
    populate_all_high_elevation_forecast_data,
    populate_all_local_weather_data,
    populate_all_regional_weather_data,
)
from apps.webcam.tasks import (
    add_order_to_cameras,
    build_route_geometries,
    populate_all_webcam_data,
    update_all_webcam_data,
)
from django.core.cache import cache
from django.core.management import call_command
from huey import crontab
from huey.contrib.djhuey import db_periodic_task, lock_task, on_startup, post_execute


@db_periodic_task(crontab(hour="*/6", minute="0"))
@lock_task('populate-camera-lock')
def populate_webcam_task():
    populate_all_webcam_data()


@db_periodic_task(crontab(minute="*/1"))
@lock_task('update-camera-lock')
def update_camera_task():
    update_all_webcam_data()


@db_periodic_task(crontab(minute="*/1"))
@lock_task('events-lock')
def populate_event_task():
    populate_all_event_data()


@db_periodic_task(crontab(hour="*/24", minute="0"))
@lock_task('ferries-lock')
def populate_ferry_task():
    populate_all_ferry_data()


@db_periodic_task(crontab(minute="*/1"))
@lock_task('publish-scheduled-lock')
def publish_scheduled():
    call_command('publish_scheduled')


@db_periodic_task(crontab(minute="*/10"))
@lock_task('regional-weather-lock')
def populate_regional_weather_task():
    populate_all_regional_weather_data()


@db_periodic_task(crontab(minute="*/10"))
@lock_task('current-weather-lock')
def populate_current_weather_task():
    populate_all_local_weather_data()


@db_periodic_task(crontab(minute="*/10"))
@lock_task('he-weather-lock')
def populate_he_weather_task():
    populate_all_high_elevation_forecast_data()


@db_periodic_task(crontab(hour="*/24", minute="0"))
@lock_task('popoulate-rest-stop-lock')
def populate_rest_stop_task():
    populate_all_rest_stop_data()


@db_periodic_task(crontab(hour="*/24", minute="0", day_of_week="6"))
@lock_task('reference-route-lock')
def build_reference_route_geometries():
    build_route_geometries()


@db_periodic_task(crontab(hour="*/24", minute="0", day_of_week="0"))
@lock_task('add-camera-lock')
def add_camera_orders():
    add_order_to_cameras()


@on_startup()
def startup_timestamp(task, task_value, exc):
    cache.set("last_task_execution", datetime.datetime.now())


@post_execute()
def post_execute_timestamp(task, task_value, exc):
    cache.set("last_task_execution", datetime.datetime.now())
