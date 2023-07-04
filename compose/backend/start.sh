#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset

echo 'migrating'
python manage.py migrate

echo 'migration done; creating superuser'
python manage.py createsuperuser \
    --noinput \
    --username $DJANGO_SUPERUSER_USERNAME \
    --email $DJANGO_SUPERUSER_EMAIL || true 2> /dev/null

echo 'creating superuser done; starting service'
python manage.py runserver 0.0.0.0:8000
