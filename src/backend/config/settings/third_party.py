import os
from pathlib import Path

import environ

# Base dir and env
BASE_DIR = Path(__file__).resolve().parents[4]
env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env", overwrite=True)

# Django REST
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.AllowAny",),
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ),
}

# Huey
HUEY = {
    "connection": {
        "host": env("REDIS_HOST"),
        "port": env("REDIS_PORT"),
    },
    "immediate": False,
}

# Wagtail
WAGTAIL_SITE_NAME = 'DriveBC'
WAGTAILEMBEDS_RESPONSIVE_HTML = True
WAGTAILADMIN_BASE_URL = "\\cms-admin"

# reCAPTCHA
DRF_RECAPTCHA_SECRET_KEY = env("DJANGO_RECAPTCHA_SECRET_KEY")

# On windows, GDAL and GEOS require explicit paths to the dlls
if os.name == "nt":
    GEOS_LIBRARY_PATH = env("GEOS_LIBRARY_PATH")
    GDAL_LIBRARY_PATH = env("GDAL_LIBRARY_PATH")
