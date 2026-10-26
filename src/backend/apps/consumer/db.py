import os
from apps.consumer.models import ImageIndex
from asgiref.sync import sync_to_async
from apps.webcam.models import CameraSource
import requests
from django.conf import settings

# Connection settings
SQL_DB_SERVER = os.getenv("SQL_DB_SERVER")
SQL_DB_NAME = os.getenv("SQL_DB_NAME")
SQL_DB_USER = os.getenv("SQL_DB_USER")
SQL_DB_PASSWORD = os.getenv("SQL_DB_PASSWORD")
SQL_DB_DRIVER = "ODBC Driver 18 for SQL Server"

def get_all_from_db(camera_id=None):
    query = CameraSource.objects.using("mssql").all()
    if camera_id:
        query = query.filter(id=camera_id)

    cameras = list(query)
    return cameras

def get_all(camera_id=None):
    if settings.CAMERA_SOURCE == "api":
        return get_all_from_api(camera_id)
    return get_all_from_db(camera_id)

def _fetch_from_api(camera_id=None):
    url = f"{settings.CAMERA_API_URL.rstrip('/')}/cameras/"
    headers = {"X-Internal-Token": settings.INTERNAL_API_TOKEN}
    params = {"id": camera_id} if camera_id else None
    resp = requests.get(url, params=params, headers=headers, timeout=10)
    resp.raise_for_status()
    return resp.json()

def _to_camera_source(item):
    return CameraSource(
        id=item["id"],
        cam_internetname=item["cam_internetname"],
        cam_internetcaption=item["cam_internetcaption"],
        cam_locationsorientation=item["cam_locationsorientation"],
        cam_locationsgeo_latitude=item["cam_locationsgeo_latitude"],
        cam_locationsgeo_longitude=item["cam_locationsgeo_longitude"],
        cam_internetcomments=item["cam_internetcomments"],
        cam_locationssegment=item["cam_locationssegment"],
        cam_locationslrs_node=item["cam_locationslrs_node"],
        cam_locationsregion=item["cam_locationsregion"],
        cam_locationshighway=item["cam_locationshighway"],
        cam_locationshighway_section=item["cam_locationshighway_section"],
        cam_locationselevation=item["cam_locationselevation"],
        cam_locationsweather_station=item["cam_locationsweather_station"],
        cam_internetdbc_mark=item["cam_internetdbc_mark"],
        cam_controldisabled=item["cam_controldisabled"],
        cam_controldisappear=item["cam_controldisappear"],
        cam_maintenanceis_on_demand=item["cam_maintenanceis_on_demand"],
        isnew=item["isNew"],
    )

def get_all_from_api(camera_id=None):
    return [_to_camera_source(i) for i in _fetch_from_api(camera_id)]


@sync_to_async
def load_index_from_db():
    records = ImageIndex.objects.order_by('timestamp').all()

    index_db = [
        {
            "camera_id": record.camera_id,
            "timestamp": record.timestamp,
        }
        for record in records
    ]

    return index_db