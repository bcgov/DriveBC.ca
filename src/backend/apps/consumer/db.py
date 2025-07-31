import os
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
from apps.consumer.models import ImageIndex
from asgiref.sync import sync_to_async

# Connection settings
SQL_DB_SERVER = os.getenv("SQL_DB_SERVER", "sql-server-db")
SQL_DB_NAME = os.getenv("SQL_DB_NAME", "camera-db")
SQL_DB_USER = os.getenv("SQL_DB_USER", "sa")
SQL_DB_PASSWORD = os.getenv("SQL_DB_PASSWORD", "YourStrong@Passw0rd")
SQL_DB_DRIVER = "ODBC Driver 17 for SQL Server"  # Make sure this driver is installed on the container

# Build connection URL
connection_url = URL.create(
    "mssql+pyodbc",
    username=SQL_DB_USER,
    password=SQL_DB_PASSWORD,
    host=SQL_DB_SERVER,
    port=1433,
    database=SQL_DB_NAME,
    query={"driver": SQL_DB_DRIVER}
)

# Create SQLAlchemy engine
engine = create_engine(connection_url)

def get_all_from_db():
    cams_sql = """
        SELECT [ID], [Cam_LocationsGeo_Latitude], [Cam_LocationsGeo_Longitude], [Cam_ControlDisabled]
        FROM [WEBCAM_DEV].[dbo].[Cams]
    """

    cams_live_sql = """
        SELECT ID, Cam_InternetName, Cam_ControlDisabled, Cam_ControlShort_Message, Cam_ControlLong_Message
        FROM [WEBCAM_DEV].[dbo].[Cams_Live]
    """

    with engine.connect() as connection:
        try:
            # Query from Cams
            result_cams = connection.execute(text(cams_sql))
            cams_rows = {row.ID: dict(row._mapping) for row in result_cams}

            # Query from Cams_Live
            result_live = connection.execute(text(cams_live_sql))
            live_rows = {row.ID: dict(row._mapping) for row in result_live}

            # Merge based on ID
            merged_rows = []
            for cam_id, cam_data in cams_rows.items():
                live_data = live_rows.get(cam_id, {})
                merged_row = {**cam_data, **live_data}
                merged_rows.append(merged_row)

            return merged_rows

        except Exception as e:
            print(f"Failed to connect to the database: {e}")
            return []
        
@sync_to_async
def load_index_from_db():
    records = ImageIndex.objects.order_by('timestamp').all()

    index_db = [
        {
            "camera_id": record.camera_id,
            "original_pvc_path": record.original_pvc_path,
            "watermarked_pvc_path": record.watermarked_pvc_path,
            "original_s3_path": record.original_s3_path,
            "watermarked_s3_path": record.watermarked_s3_path,
            "timestamp": record.timestamp,
        }
        for record in records
    ]

    return index_db