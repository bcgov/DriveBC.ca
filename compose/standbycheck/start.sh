#!/bin/bash

# If the cluster is golddr, we always want to return 200 OK
if [ "$CLUSTER" = "golddr" ]; then
  echo "golddr cluster detected, returning 200 OK"
  caddy run --config /app/Caddyfile_200
else
  caddy run --config /app/Caddyfile_200 &
  bash /app/lbcheck.sh
fi