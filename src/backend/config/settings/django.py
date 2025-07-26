import os
from pathlib import Path

import environ
from corsheaders.defaults import default_headers

# Base dir and env
BASE_DIR = Path(__file__).resolve().parents[4]
SRC_DIR = Path(__file__).resolve().parents[3]
APP_DIR = Path(__file__).resolve().parents[2]
env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env", overwrite=True)

# Meta
DEBUG = env("DEBUG") == "True"
SECRET_KEY = env("SECRET_KEY")
WSGI_APPLICATION = "config.wsgi.application"

# Paths and urls
APPEND_SLASH = True
ROOT_URLCONF = "config.urls"
STATIC_URL = "/django-static/"
STATIC_ROOT = os.path.join(SRC_DIR, 'static')
MEDIA_URL = '/django-media/'
MEDIA_ROOT = os.path.join(SRC_DIR, 'media')
FRONTEND_BASE_URL = env("FRONTEND_BASE_URL", default="http://localhost:3000/")

# Security
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")
CORS_ORIGIN_WHITELIST = env.list("DJANGO_CORS_ORIGIN_WHITELIST")
CSRF_TRUSTED_ORIGINS = env.list("DJANGO_CORS_ORIGIN_WHITELIST")
CORS_ALLOW_HEADERS = default_headers + ("contenttype",)
CORS_ALLOW_CREDENTIALS = True
CSRF_COOKIE_SECURE = env.bool("DJANGO_CSRF_COOKIE_SECURE")
SECURE_SSL_REDIRECT = env.bool("DJANGO_SECURE_SSL_REDIRECT")
SESSION_COOKIE_SECURE = env.bool("DJANGO_SESSION_COOKIE_SECURE")
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

MIDDLEWARE = [
    "django.middleware.gzip.GZipMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "allauth.usersessions.middleware.UserSessionsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "allauth.account.middleware.AccountMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "wagtail.contrib.redirects.middleware.RedirectMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [APP_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "django.template.context_processors.csrf",
            ],
        },
    },
]

# Auth
AUTH_USER_MODEL = "authentication.DriveBCUser"
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": f"django.contrib.auth.password_validation.{name}"}
    for name in [
        "UserAttributeSimilarityValidator",
        "MinimumLengthValidator",
        "CommonPasswordValidator",
        "NumericPasswordValidator",
    ]
]

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",

    # `allauth` specific authentication methods, such as login by email
    'allauth.account.auth_backends.AuthenticationBackend',
]

LOGIN_REDIRECT_URL = FRONTEND_BASE_URL
IDIR_LOGIN_PATH = 'accounts/oidc/idir/login/?process=login&next=%2Fdrivebc-admin%2F&auth_params=kc_idp_hint=azureidir'
LOGIN_URL = (('http://localhost:8000/' if 'localhost' in FRONTEND_BASE_URL else FRONTEND_BASE_URL) + IDIR_LOGIN_PATH)

# Language
USE_I18N = False

# Time
TIME_ZONE = "America/Vancouver"
USE_TZ = True

# Apps
DJANGO_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.gis",
    "django.contrib.sessions",
    "django.contrib.staticfiles",
    "django.contrib.messages",
]

THIRD_PARTY_APPS = [
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.openid_connect",
    "allauth.usersessions",
    "huey.contrib.djhuey",
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_gis",
    "django_filters",
    "drf_recaptcha",
    "corsheaders",
    'wagtail.api.v2',
    "wagtail.contrib.forms",
    "wagtail.contrib.redirects",
    "wagtail.contrib.table_block",
    "wagtail.embeds",
    "wagtail.sites",
    "wagtail.users",
    "wagtail.snippets",
    "wagtail.documents",
    "wagtail.images",
    "wagtail.search",
    "wagtail",
    "modelcluster",
    "taggit",
    'email_log',
]

LOCAL_APPS = [
    "apps.authentication",
    "apps.feed",
    "apps.shared",
    "apps.event",
    "apps.webcam",
    "apps.cms",
    "apps.weather",
    "apps.rest",
    "apps.ferry",
    "apps.border",
    "apps.wildfire",
]

# apps with features overridden in local apps (e.g., admin templates) go here
OVERRIDDEN_APPS = [
    "config.admin.DriveBCAdminConfig",
    "wagtail.admin",
    "wagtail_modeladmin",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS + OVERRIDDEN_APPS

# Storage
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": env("DB_NAME"),
        "USER": env("DB_USER"),
        "PASSWORD": env("DB_PASSWORD"),
        "HOST": env("DB_HOST"),
        "PORT": env.int("DB_PORT"),
    }
}
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://" + env("REDIS_HOST") + ":" + env("REDIS_PORT"),
    }
}
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    }
}

# Email
EMAIL_BACKEND = env('DJANGO_EMAIL_BACKEND')
EMAIL_HOST = env('DJANGO_EMAIL_HOST')
EMAIL_PORT = env('DJANGO_EMAIL_PORT')
DEFAULT_FROM_EMAIL = 'DoNotReply_DriveBC@gov.bc.ca'

# Logging
ROOT_LOG_LEVEL = env('ROOT_LOG_LEVEL', default='WARNING')
HUEY_LOG_LEVEL = env('HUEY_LOG_LEVEL', default='INFO')

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": 'standard',
        },
    },
    'formatters': {
        'standard': {
            'class': 'logging.Formatter',
            'format': '[%(asctime)s] %(levelname)s:%(name)s:%(threadName)s:%(message)s'
        },
    },
    "root": {
        "handlers": ["console"],
        "level": ROOT_LOG_LEVEL,
    },
    "loggers": {
        "huey": {
            "handlers": ["console"],
            "level": HUEY_LOG_LEVEL,
            "propagate": False
        },
    },
}

TEST_RUNNER = env("TEST_RUNNER", default="django.test.runner.DiscoverRunner")
