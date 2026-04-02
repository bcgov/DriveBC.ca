#!/bin/sh
set -e

# This runs as an init container; outputs to shared volume for main container

# Source the vault secrets
. /vault/secrets/secrets.env

SHARED_CONFIG="/shared-config"
mkdir -p "${SHARED_CONFIG}/SITE_ASSETS"
mkdir -p "${SHARED_CONFIG}/NGINX_CONFIG"
SITE_ASSETS="${SHARED_CONFIG}/SITE_ASSETS"
NGINX_CONFIG="${SHARED_CONFIG}/NGINX_CONFIG"

# --- Maintenance Mode Check ---
if [ "$MAINTENANCE_MODE" = "true" ]; then
    echo "Maintenance mode is enabled."
    cp /etc/nginx/default_maintenance.txt "${NGINX_CONFIG}/default.conf"
    exit 0
fi

echo "Copying /usr/share/nginx/html/ to ${SITE_ASSETS}..."
cp -r /usr/share/nginx/html/* "${SITE_ASSETS}/"

cat > "${SITE_ASSETS}/config_snippet.html" <<EOF
<script>
window.__ENV__ = {
  BASE_MAP: '${VITE_BASE_MAP:-$REACT_APP_BASE_MAP}',
  MAP_STYLE: '${VITE_MAP_STYLE:-$REACT_APP_MAP_STYLE}',
  API_HOST: '${VITE_API_HOST:-$REACT_APP_API_HOST}',
  REPORT_WMS_LAYER: '${VITE_REPORT_WMS_LAYER:-$REACT_APP_REPORT_WMS_LAYER}',
  GEOCODER_HOST: '${VITE_GEOCODER_HOST:-$REACT_APP_GEOCODER_HOST}',
  GEOCODER_API_CLIENT_ID: '${VITE_GEOCODER_API_CLIENT_ID:-$REACT_APP_GEOCODER_API_CLIENT_ID}',
  ROUTABLE_LOCATIONS_HOST: '${VITE_ROUTABLE_LOCATIONS_HOST:-$REACT_APP_ROUTABLE_LOCATIONS_HOST}',
  ROUTE_PLANNER: '${VITE_ROUTE_PLANNER:-$REACT_APP_ROUTE_PLANNER}',
  ROUTE_PLANNER_CLIENT_ID: '${VITE_ROUTE_PLANNER_CLIENT_ID:-$REACT_APP_ROUTE_PLANNER_CLIENT_ID}',
  REPLAY_THE_DAY: '${VITE_REPLAY_THE_DAY:-$REACT_APP_REPLAY_THE_DAY}',
  SURVEY_LINK: '${VITE_SURVEY_LINK:-$REACT_APP_SURVEY_LINK}',
  BCEID_REGISTER_URL: '${VITE_BCEID_REGISTER_URL:-$REACT_APP_BCEID_REGISTER_URL}',
  FROM_EMAIL: '${VITE_FROM_EMAIL:-$REACT_APP_FROM_EMAIL}',
  LEGACY_URL: '${VITE_LEGACY_URL:-$REACT_APP_LEGACY_URL}',
  RECAPTCHA_CLIENT_ID: '${VITE_RECAPTCHA_CLIENT_ID:-$REACT_APP_RECAPTCHA_CLIENT_ID}',
  ALTERNATE_ROUTE_GDF: '${VITE_ALTERNATE_ROUTE_GDF:-$REACT_APP_ALTERNATE_ROUTE_GDF}',
  ALTERNATE_ROUTE_TURNCOST: '${VITE_ALTERNATE_ROUTE_TURNCOST:-$REACT_APP_ALTERNATE_ROUTE_TURNCOST}',
  ALTERNATE_ROUTE_XINGCOST: '${VITE_ALTERNATE_ROUTE_XINGCOST:-$REACT_APP_ALTERNATE_ROUTE_XINGCOST}',
  DEPLOYMENT_TAG: '${DEPLOYMENT_TAG}',
  RELEASE: '${RELEASE:-}'
};
</script>
EOF

TARGET_INDEX="${SITE_ASSETS}/index.html"
SNIPPET_FILE="${SITE_ASSETS}/config_snippet.html"

echo "Injecting runtime config into ${TARGET_INDEX}..."

sed -i "/<head>/r ${SNIPPET_FILE}" "$TARGET_INDEX"

echo "Re-compressing index.html..."
rm "${TARGET_INDEX}.gz"
rm -f "${TARGET_INDEX}.br"
gzip -9 -k "$TARGET_INDEX"
brotli -f -q 11 "$TARGET_INDEX"

# Cleanup temp file
rm "${SITE_ASSETS}/config_snippet.html"

# --- Nginx Configuration ---
cp /etc/nginx/conf.d/default.conf "${NGINX_CONFIG}/default.conf"
cp /etc/nginx/conf.d/security_headers.conf "${NGINX_CONFIG}/security_headers.conf"

# -- Replace {ENVIRONMENT} placeholder ---
sed -i "s~{ENVIRONMENT}~$ENVIRONMENT~g" "${NGINX_CONFIG}/default.conf"

# --- Handle Robots Tag ---
if [ "$ENVIRONMENT" = "prod-drivebc" ]; then
    echo "Environment is 'prod'; removing X-Robots-Tag noindex header."
    sed -i '/add_header X-Robots-Tag "noindex";/d' "${NGINX_CONFIG}/security_headers.conf"
else
    echo "Environment is not 'prod'; keeping X-Robots-Tag noindex header."
fi

# --- Handle Debug Route ---
if [ "$ENVIRONMENT" = "dev-drivebc" ]; then
    echo "Environment is 'dev'; Adding the debug toolbar route."
    sed -i 's/healthcheck)/healthcheck|__debug__)/' "${NGINX_CONFIG}/default.conf"
else
    echo "Environment is not 'dev'; not adding the debug toolbar route."
fi

# Create blocked IPs configuration file
BLOCKED_CONF="${NGINX_CONFIG}/blocked_ips.conf"
> "$BLOCKED_CONF"
if [ -n "$BLOCKED_IPS" ]; then
    echo "Processing blocked IPs..."
    for ip in $(echo "$BLOCKED_IPS" | tr ';' ' '); do
        CLEAN_IP=$(echo "$ip" | tr -d ' ')
        if [ -n "$CLEAN_IP" ]; then
            echo "deny $CLEAN_IP;" >> "$BLOCKED_CONF"
        fi
    done
    echo "Blocked IPs configuration created."
fi

echo "Configuration and assets ready in ${SHARED_CONFIG}:"
ls -la "${SHARED_CONFIG}/"
