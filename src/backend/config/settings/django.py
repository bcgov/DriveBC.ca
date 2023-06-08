from pathlib import Path

import environ
from corsheaders.defaults import default_headers

# Base dir and env
BASE_DIR = Path(__file__).resolve().parents[4]
env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env', overwrite=True)

# Meta
DEBUG = env('DEBUG')
SECRET_KEY = env('SECRET_KEY')
WSGI_APPLICATION = 'config.wsgi.application'

# Paths and urls
ROOT_URLCONF = 'config.urls'
STATIC_URL = 'static/'

# Security
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")
CORS_ORIGIN_WHITELIST = env.list("DJANGO_CORS_ORIGIN_WHITELIST")
CORS_ALLOW_HEADERS = default_headers + ("contenttype",)
CSRF_COOKIE_SECURE = env.bool('DJANGO_CSRF_COOKIE_SECURE')
SECURE_SSL_REDIRECT = env.bool('DJANGO_SECURE_SSL_REDIRECT')
SESSION_COOKIE_SECURE = env.bool('DJANGO_SESSION_COOKIE_SECURE')

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    "corsheaders.middleware.CorsMiddleware",
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Auth
AUTH_USER_MODEL = 'authentication.DriveBCUser'
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Language
LANGUAGE_CODE = 'en-us'
USE_I18N = True

# Time
TIME_ZONE = 'UTC'
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
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    "dj_rest_auth",
    'dj_rest_auth.registration',
    "huey.contrib.djhuey",
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_gis",
    "corsheaders",
]

LOCAL_APPS = [
    "apps.authentication",
    "apps.feed",
    "apps.shared",
    "apps.webcam"
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# DB and cache
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
DATABASES = {
    'default': {
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

# Email
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # To be changed
