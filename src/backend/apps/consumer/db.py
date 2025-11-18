import os
from apps.consumer.models import ImageIndex
from asgiref.sync import sync_to_async
from apps.webcam.models import CameraSource

# Connection settings
SQL_DB_SERVER = os.getenv("SQL_DB_SERVER")
SQL_DB_NAME = os.getenv("SQL_DB_NAME")
SQL_DB_USER = os.getenv("SQL_DB_USER")
SQL_DB_PASSWORD = os.getenv("SQL_DB_PASSWORD")
SQL_DB_DRIVER = "ODBC Driver 17 for SQL Server"

def get_all_from_db():
    return list(CameraSource.objects.using("mssql").all())

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