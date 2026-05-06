#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset

python manage.py monitor_camera_status &
python manage.py run_huey
