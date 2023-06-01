#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset

python manage.py migrate

python manage.py createsuperuser \
    --noinput \
    --username $DJANGO_SUPERUSER_USERNAME \
    --email $DJANGO_SUPERUSER_EMAIL || true

python manage.py runserver 0.0.0.0:8000
