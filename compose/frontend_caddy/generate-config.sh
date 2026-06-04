#!/bin/sh
set -e

# Source the vault secrets
if [ -f /vault/secrets/secrets.env ]; then
    . /vault/secrets/secrets.env
fi

# In Caddy, we will serve from the shared config directory
SHARED_CONFIG="/shared-config"
mkdir -p "${SHARED_CONFIG}/static"

# --- Copy Static Assets and Index ---
# Note: Source path changed to match the Caddy Dockerfile path
echo "Copying /usr/share/caddy/html/ to ${SHARED_CONFIG}..."
cp -r /usr/share/caddy/html/* "${SHARED_CONFIG}/"

# --- Create Config Snippet ---
cat > "${SHARED_CONFIG}/config_snippet.html" <<EOF
<script>
window.__ENV__ = {
  BASE_MAP: '${REACT_APP_BASE_MAP}',
  MAP_STYLE: '${REACT_APP_MAP_STYLE}',
  API_HOST: '${REACT_APP_API_HOST}',
  REPORT_WMS_LAYER: '${REACT_APP_REPORT_WMS_LAYER}',
  GEOCODER_HOST: '${REACT_APP_GEOCODER_HOST}',
  GEOCODER_API_CLIENT_ID: '${REACT_APP_GEOCODER_API_CLIENT_ID}',
  ROUTABLE_LOCATIONS_HOST: '${REACT_APP_ROUTABLE_LOCATIONS_HOST}',
  ROUTE_PLANNER: '${REACT_APP_ROUTE_PLANNER}',
  ROUTE_PLANNER_CLIENT_ID: '${REACT_APP_ROUTE_PLANNER_CLIENT_ID}',
  REPLAY_THE_DAY: '${REACT_APP_REPLAY_THE_DAY}',
  SURVEY_LINK: '${REACT_APP_SURVEY_LINK}',
  BCEID_REGISTER_URL: '${REACT_APP_BCEID_REGISTER_URL}',
  FROM_EMAIL: '${REACT_APP_FROM_EMAIL}',
  LEGACY_URL: '${REACT_APP_LEGACY_URL}',
  RECAPTCHA_CLIENT_ID: '${REACT_APP_RECAPTCHA_CLIENT_ID}',
  PRIMARY_ROUTE_GDF: '${REACT_APP_PRIMARY_ROUTE_GDF}',
  PRIMARY_ROUTE_TURNCOST: '${REACT_APP_PRIMARY_ROUTE_TURNCOST}',
  PRIMARY_ROUTE_XINGCOST: '${REACT_APP_PRIMARY_ROUTE_XINGCOST}',
  ALTERNATE_ROUTE_GDF: '${REACT_APP_ALTERNATE_ROUTE_GDF}',
  ALTERNATE_ROUTE_TURNCOST: '${REACT_APP_ALTERNATE_ROUTE_TURNCOST}',
  ALTERNATE_ROUTE_XINGCOST: '${REACT_APP_ALTERNATE_ROUTE_XINGCOST}',
  DEPLOYMENT_TAG: '${DEPLOYMENT_TAG}',
  MAINTENANCE_MODE: '${MAINTENANCE_MODE}',
  RELEASE: '${RELEASE:-}',
};
</script>
EOF

CONFIG_ONE_LINE=$(tr -d '\n' < "${SHARED_CONFIG}/config_snippet.html")
TARGET_INDEX="${SHARED_CONFIG}/index.html"

# --- Inject Config into HTML Safely ---
if [ -f "$TARGET_INDEX" ]; then
    echo "Injecting runtime config into ${TARGET_INDEX}..."
    SAFE_CONFIG=$(echo "$CONFIG_ONE_LINE" | sed 's/&/\\&/g')
    sed -i "s~<head>~<head>${SAFE_CONFIG}~" "$TARGET_INDEX"
    rm "${SHARED_CONFIG}/config_snippet.html"
else
    echo "Error: index.html not found!"
    exit 1
fi

# --- Blocked IPs Configuration ---
# Caddy can read a list of IPs from a file. We create a simple newline-separated list.
BLOCKED_LIST="${SHARED_CONFIG}/blocked_ips.txt"
> "$BLOCKED_LIST"
if [ -n "$BLOCKED_IPS" ]; then
    echo "Processing blocked IPs..."
    for ip in $(echo "$BLOCKED_IPS" | tr ';' ' '); do
        CLEAN_IP=$(echo "$ip" | tr -d ' ')
        if [ -n "$CLEAN_IP" ]; then 
            echo "$CLEAN_IP" >> "$BLOCKED_LIST"
        fi
    done
fi

# --- Re-compress runtime-modified index.html ---
echo "Re-compressing updated index.html (gzip, brotli, zstd)..."

# 1. Gzip (-f forces overwriting index.html.gz brought over by cp)
gzip -f -k -9 "$TARGET_INDEX"

# 2. Brotli (-f forces overwriting index.html.br)
if command -v brotli > /dev/null; then
    brotli -f -k -q 11 "$TARGET_INDEX"
else
    echo "Warning: brotli is not installed!"
fi

# 3. Zstd (-f forces overwriting index.html.zst)
if command -v zstd > /dev/null; then
    zstd -f -k -19 "$TARGET_INDEX"
else
    echo "Error: zstd is not installed!"
    exit 1
fi

echo "Done! Assets ready in ${SHARED_CONFIG}"