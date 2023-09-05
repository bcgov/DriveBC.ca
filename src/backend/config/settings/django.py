import os
from pathlib import Path

import environ
from corsheaders.defaults import default_headers

# Base dir and env
BASE_DIR = Path(__file__).resolve().parents[4]
SRC_DIR = Path(__file__).resolve().parents[3]
env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env", overwrite=True)

# Meta
DEBUG = env("DEBUG") == 'True'
SECRET_KEY = env("SECRET_KEY")
WSGI_APPLICATION = "config.wsgi.application"

# Paths and urls
APPEND_SLASH = True
ROOT_URLCONF = "config.urls"
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(SRC_DIR, 'static')
MEDIA_ROOT = os.path.join(SRC_DIR, 'media')
MEDIA_URL = '/media/'

# Security
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")
CORS_ORIGIN_WHITELIST = env.list("DJANGO_CORS_ORIGIN_WHITELIST")
CORS_ALLOW_HEADERS = default_headers + ("contenttype",)
CSRF_COOKIE_SECURE = env.bool("DJANGO_CSRF_COOKIE_SECURE")
SECURE_SSL_REDIRECT = env.bool("DJANGO_SECURE_SSL_REDIRECT")
SESSION_COOKIE_SECURE = env.bool("DJANGO_SESSION_COOKIE_SECURE")
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "wagtail.contrib.redirects.middleware.RedirectMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
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

# Language
USE_I18N = False

# Time
TIME_ZONE = "America/Vancouver"
USE_TZ = True

# Apps
DJANGO_APPS = [
    "django.contrib.admin",
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
    "dj_rest_auth",
    "dj_rest_auth.registration",
    "huey.contrib.djhuey",
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_gis",
    "django_filters",
    "corsheaders",
    'wagtail.api.v2',
    "wagtail.contrib.forms",
    "wagtail.contrib.redirects",
    "wagtail.embeds",
    "wagtail.sites",
    "wagtail.users",
    "wagtail.snippets",
    "wagtail.documents",
    "wagtail.images",
    "wagtail.search",
    "wagtail.admin",
    "wagtail",
    "modelcluster",
    "taggit",
]

LOCAL_APPS = [
    "apps.authentication",
    "apps.feed",
    "apps.shared",
    "apps.event",
    "apps.webcam",
    "apps.cms"
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

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
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
