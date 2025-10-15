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
    "consumer": {
        "flush_locks": True,
        "workers": 4,
        "worker_type": "thread",
    }
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
KEYCLOAK_CLIENT_ID = env("BCEID_CLIENT_ID")
KEYCLOAK_SECRET = env("BCEID_SECRET")
KEYCLOAK_URL = env("BCEID_URL")

ACCOUNT_ADAPTER = 'apps.authentication.adapters.AccountAdapter'

# need our own adapter to override various redirect url methods following
# login or logout

SOCIALACCOUNT_PROVIDERS = {
    'openid_connect': {
        'APPS': [
            {
                'provider_id': 'idir',
                'name': 'Azure IDIR via Keycloak',
                'client_id': KEYCLOAK_CLIENT_ID,
                'secret': KEYCLOAK_SECRET,
                'settings': {
                    'server_url': KEYCLOAK_URL,
                    'auth_params': {
                        'kc_idp_hint': 'azureidir',
                    },
                },
            },
            {
                'provider_id': 'bceid',
                'name': 'BCeID via Keycloak',
                'client_id': KEYCLOAK_CLIENT_ID,
                'secret': KEYCLOAK_SECRET,
                'settings': {
                    'server_url': KEYCLOAK_URL,
                    'auth_params': {
                        'kc_idp_hint': 'bceidbasic',
                    },
                },
            },
            {
                'provider_id': 'otp',
                'name': 'One-time password via Keycloak',
                'client_id': KEYCLOAK_CLIENT_ID,
                'secret': KEYCLOAK_SECRET,
                'settings': {
                    'server_url': KEYCLOAK_URL,
                    'auth_params': {
                        'kc_idp_hint': 'otp',
                    },
                },
            },
        ],
        'EMAIL_AUTHENTICATION_AUTO_CONNECT': True,
        'EMAIL_AUTHENTICATION': True,
        'STORE_TOKENS': True,
    },
}

SOCIALACCOUNT_ADAPTER = 'apps.authentication.adapters.SocialAdapter'
ACCOUNT_EMAIL_VERIFICATION = "none"
SOCIALACCOUNT_LOGIN_ON_GET = False
SOCIALACCOUNT_EMAIL_VERIFICATION = False
SOCIALACCOUNT_EMAIL_AUTHENTICATION_AUTO_CONNECT = True
SOCIALACCOUNT_EMAIL_AUTHENTICATION = True
SOCIALACCOUNT_STORE_TOKENS = True
