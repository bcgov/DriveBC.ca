from pathlib import Path

import environ

# Base dir and env
BASE_DIR = Path(__file__).resolve().parents[4]
env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env', overwrite=True)

DEV_ENVIRONMENT = env.get_value("DEV_ENVIRONMENT", default=False)

# Image Settings
DRIVEBC_IMAGE_API_BASE_URL = env("DRIVEBC_IMAGE_API_BASE_URL")
DRIVEBC_IMAGE_BASE_URL = env("DRIVEBC_IMAGE_BASE_URL")
DRIVEBC_IMAGE_PROXY_URL = env("DRIVEBC_IMAGE_PROXY_URL")

# Feed API Settings
DRIVEBC_WEBCAM_API_BASE_URL = env("DRIVEBC_WEBCAM_API_BASE_URL")
DRIVEBC_OPEN_511_API_BASE_URL = env("DRIVEBC_OPEN_511_API_BASE_URL")
DRIVEBC_INLAND_FERRY_API_BASE_URL = env("DRIVEBC_INLAND_FERRY_API_BASE_URL")
DRIVEBC_DIT_API_BASE_URL = env("DRIVEBC_DIT_API_BASE_URL")

# Weather API Settings
WEATHER_CLIENT_ID = env("WEATHER_CLIENT_ID")
WEATHER_CLIENT_SECRET = env("WEATHER_CLIENT_SECRET")
DRIVEBC_WEATHER_API_BASE_URL = env("DRIVEBC_WEATHER_API_BASE_URL")
DRIVEBC_WEATHER_AREAS_API_BASE_URL = env("DRIVEBC_WEATHER_AREAS_API_BASE_URL")
DRIVEBC_WEATHER_API_TOKEN_URL = env("DRIVEBC_WEATHER_API_TOKEN_URL")
DRIVEBC_WEATHER_CURRENT_API_BASE_URL = env("DRIVEBC_WEATHER_CURRENT_API_BASE_URL")
DRIVEBC_WEATHER_FORECAST_API_BASE_URL = env("DRIVEBC_WEATHER_FORECAST_API_BASE_URL")
DRIVEBC_WEATHER_CURRENT_STATIONS_API_BASE_URL = env("DRIVEBC_WEATHER_CURRENT_STATIONS_API_BASE_URL")
DRIVEBC_SAWSX_API_BASE_URL = env("DRIVEBC_SAWSX_API_BASE_URL")

# Rest Stop API Settings
DRIVEBC_REST_STOP_API_BASE_URL=env("DRIVEBC_REST_STOP_API_BASE_URL")

# Email
ACCESS_REQUEST_RECEIVERS = env('DRIVEBC_ACCESS_REQUEST_RECEIVERS', default='').split(';')
FORCE_IDIR_AUTHENTICATION = env('FORCE_IDIR_AUTHENTICATION', default=False)
DRIVEBC_FEEDBACK_EMAIL_DEFAULT = env("DRIVEBC_FEEDBACK_EMAIL_DEFAULT", default='DoNotReply_DriveBC@gov.bc.ca')

DRIVEBC_ROUTE_PLANNER_API_BASE_URL = env('DRIVEBC_ROUTE_PLANNER_API_BASE_URL')
DRIVEBC_ROUTE_PLANNER_API_AUTH_KEY = env('DRIVEBC_ROUTE_PLANNER_API_AUTH_KEY')

# Closure phrase ids
CLOSED_PHRASE_IDS = env('CLOSED_PHRASE_IDS')