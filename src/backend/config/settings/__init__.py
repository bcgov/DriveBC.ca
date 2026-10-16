import zoneinfo
from pathlib import Path

# DBC22-7612: TEMPORARY patched Vancouver (PCT) / Edmonton (MDT) ahead of system tzdata; see tzdata/build.sh
zoneinfo.reset_tzpath([str(Path(__file__).resolve().parents[2] / 'tzdata'), *zoneinfo.TZPATH])
zoneinfo.ZoneInfo.clear_cache()

from .django import *  # Django settings
from .drivebc import *  # DriveBC project related settings
from .third_party import *  # Huey, Django REST Framework etc.
