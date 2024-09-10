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
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.TokenAuthentication",
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

# Allauth

# need our own adapter to override various redirect url methods following
# login or logout
ACCOUNT_ADAPTER = 'apps.authentication.adapters.AccountAdapter'

SOCIALACCOUNT_PROVIDERS = {
    'openid_connect': {
        'SOCIALACCOUNT_EMAIL_VERIFICATION': 'none',
        'SOCIALACCOUNT_LOGIN_ON_GET': True,
        'APP': {
            'provider_id': 'bceid',
            'name': 'BCeID via Keycloak',
            'client_id': env("BCEID_CLIENT_ID"),
            'secret': env("BCEID_SECRET"),
            'settings': {
                'server_url': env("BCEID_URL"),
            }
        },
        'AUTH_PARAMS': {
            'kc_idp_hint': 'bceidbasic',
        },
    }
}