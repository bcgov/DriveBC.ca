from pathlib import Path

import environ

# Base dir and env
BASE_DIR = Path(__file__).resolve().parents[4]
env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env', overwrite=True)

# Drive BC API Settings
DRIVEBC_ROUTE_PLANNER_API_BASE_URL = env("DRIVEBC_ROUTE_PLANNER_API_BASE_URL")
DRIVEBC_ROUTE_PLANNER_API_AUTH_KEY = env("DRIVEBC_ROUTE_PLANNER_API_AUTH_KEY")
DRIVEBC_WEBCAM_API_BASE_URL = env("DRIVEBC_WEBCAM_API_BASE_URL")
DRIVEBC_OPEN_511_API_BASE_URL = env("DRIVEBC_OPEN_511_API_BASE_URL")
