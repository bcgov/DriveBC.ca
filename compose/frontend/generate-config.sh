#!/bin/sh
set -e

# Source the vault secrets
. /vault/secrets/secrets.env

SHARED_CONFIG="/shared-config"
mkdir -p "${SHARED_CONFIG}/static"

# --- Copy Static Assets and Index ---
echo "Copying /usr/share/nginx/html/ to ${SHARED_CONFIG}..."
cp -r /usr/share/nginx/html/* "${SHARED_CONFIG}/"

# --- Create Config Snippet ---
cat > "${SHARED_CONFIG}/config_snippet.html" <<EOF
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
  PRIMARY_ROUTE_GDF: '${VITE_PRIMARY_ROUTE_GDF:-$REACT_APP_PRIMARY_ROUTE_GDF}',
  PRIMARY_ROUTE_TURNCOST: '${VITE_PRIMARY_ROUTE_TURNCOST:-$REACT_APP_PRIMARY_ROUTE_TURNCOST}',
  PRIMARY_ROUTE_XINGCOST: '${VITE_PRIMARY_ROUTE_XINGCOST:-$REACT_APP_PRIMARY_ROUTE_XINGCOST}',
  ALTERNATE_ROUTE_GDF: '${VITE_ALTERNATE_ROUTE_GDF:-$REACT_APP_ALTERNATE_ROUTE_GDF}',
  ALTERNATE_ROUTE_TURNCOST: '${VITE_ALTERNATE_ROUTE_TURNCOST:-$REACT_APP_ALTERNATE_ROUTE_TURNCOST}',
  ALTERNATE_ROUTE_XINGCOST: '${VITE_ALTERNATE_ROUTE_XINGCOST:-$REACT_APP_ALTERNATE_ROUTE_XINGCOST}',
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

# --- Nginx Configuration Routing & Rules ---
cp /etc/nginx/conf.d/default.conf "${SHARED_CONFIG}/default.conf"
cp /etc/nginx/conf.d/security_headers.conf "${SHARED_CONFIG}/security_headers.conf"
sed -i "s~{ENVIRONMENT}~$ENVIRONMENT~g" "${SHARED_CONFIG}/default.conf"

if [ "$ENVIRONMENT" = "prod-drivebc" ]; then
    echo "Environment is 'prod'; removing X-Robots-Tag noindex header."
    sed -i '/add_header X-Robots-Tag "noindex";/d' "${SHARED_CONFIG}/security_headers.conf"
fi

if [ "$ENVIRONMENT" = "dev-drivebc" ]; then
    echo "Environment is 'dev'; Adding the debug toolbar route."
    sed -i 's/healthcheck)/healthcheck|__debug__)/' "${SHARED_CONFIG}/default.conf"
fi

# Create blocked IPs configuration file
BLOCKED_CONF="${SHARED_CONFIG}/blocked_ips.conf"
> "$BLOCKED_CONF"
if [ -n "$BLOCKED_IPS" ]; then
    echo "Processing blocked IPs..."
    for ip in $(echo "$BLOCKED_IPS" | tr ';' ' '); do
        CLEAN_IP=$(echo "$ip" | tr -d ' ')
        if [ -n "$CLEAN_IP" ]; then 
            echo "deny $CLEAN_IP;" >> "$BLOCKED_CONF"
        fi
    done
fi

# --- Re-compress runtime-modified index.html ---
echo "Compressing dynamically updated index.html..."
rm -f "${TARGET_INDEX}.gz" "${TARGET_INDEX}.br"

gzip -k -9 "$TARGET_INDEX"

if command -v brotli > /dev/null; then
    brotli -f -k -q 11 "$TARGET_INDEX"
fi

echo "Done! Configuration and pre-compressed assets ready."