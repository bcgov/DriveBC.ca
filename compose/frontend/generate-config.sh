#!/bin/sh
set -e

# This runs as an init container; outputs to shared volume for main container

# Source the vault secrets
. /vault/secrets/secrets.env

SHARED_CONFIG="/shared-config"
mkdir -p "${SHARED_CONFIG}/static"

# --- Maintenance Mode Check ---
if [ "$MAINTENANCE_MODE" = "true" ]; then
    echo "Maintenance mode is enabled."
    cp /etc/nginx/default_maintenance.txt "${SHARED_CONFIG}/default.conf"
    exit 0
fi

# Generate runtime env.js in shared volume (consumed at runtime via window.__ENV__)
SHARED_CONFIG="/shared-config"
mkdir -p "$SHARED_CONFIG"

cat > "${SHARED_CONFIG}/env.js" <<EOF
window.__ENV__ = {
  REACT_APP_BASE_MAP: '${REACT_APP_BASE_MAP}',
  REACT_APP_MAP_STYLE: '${REACT_APP_MAP_STYLE}',
  REACT_APP_API_HOST: '${REACT_APP_API_HOST}',
  REACT_APP_REPORT_WMS_LAYER: '${REACT_APP_REPORT_WMS_LAYER}',
  REACT_APP_GEOCODER_HOST: '${REACT_APP_GEOCODER_HOST}',
  REACT_APP_GEOCODER_API_CLIENT_ID: '${REACT_APP_GEOCODER_API_CLIENT_ID}',
  REACT_APP_ROUTE_PLANNER: '${REACT_APP_ROUTE_PLANNER}',
  REACT_APP_ROUTE_PLANNER_CLIENT_ID: '${REACT_APP_ROUTE_PLANNER_CLIENT_ID}',
  REACT_APP_REPLAY_THE_DAY: '${REACT_APP_REPLAY_THE_DAY}',
  REACT_APP_SURVEY_LINK: '${REACT_APP_SURVEY_LINK}',
  REACT_APP_BCEID_REGISTER_URL: '${REACT_APP_BCEID_REGISTER_URL}',
  REACT_APP_FROM_EMAIL: '${REACT_APP_FROM_EMAIL}',
  REACT_APP_LEGACY_URL: '${REACT_APP_LEGACY_URL}',
  REACT_APP_RECAPTCHA_CLIENT_ID: '${REACT_APP_RECAPTCHA_CLIENT_ID}',
  REACT_APP_ALTERNATE_ROUTE_GDF: '${REACT_APP_ALTERNATE_ROUTE_GDF}',
  REACT_APP_ALTERNATE_ROUTE_TURNCOST: '${REACT_APP_ALTERNATE_ROUTE_TURNCOST}',
  REACT_APP_ALTERNATE_ROUTE_XINGCOST: '${REACT_APP_ALTERNATE_ROUTE_XINGCOST}',
  DEPLOYMENT_TAG: '${DEPLOYMENT_TAG}',
  RELEASE: '${RELEASE:-}'
};
EOF
echo "Generated env.js with runtime configuration."

# Gzip the env.js file for nginx to serve compressed version
gzip -9 -c "${SHARED_CONFIG}/env.js" > "${SHARED_CONFIG}/env.js.gz"
echo "Created gzipped version: env.js.gz"

# --- Nginx Configuration ---
cp /etc/nginx/conf.d/default.conf "${SHARED_CONFIG}/default.conf"
cp /etc/nginx/conf.d/security_headers.conf "${SHARED_CONFIG}/security_headers.conf"

# -- Replace {ENVIRONMENT} placeholder ---
sed -i "s~{ENVIRONMENT}~$ENVIRONMENT~g" "${SHARED_CONFIG}/default.conf"

# --- Handle Robots Tag ---
if [ "$ENVIRONMENT" = "prod-drivebc" ]; then
    echo "Environment is 'prod'; removing X-Robots-Tag noindex header."
    sed -i '/add_header X-Robots-Tag "noindex";/d' "${SHARED_CONFIG}/security_headers.conf"
else
    echo "Environment is not 'prod'; keeping X-Robots-Tag noindex header."
fi

# --- Handle Debug Route ---
if [ "$ENVIRONMENT" = "dev-drivebc" ]; then
    echo "Environment is 'dev'; Adding the debug toolbar route."
    sed -i 's/healthcheck)/healthcheck|__debug__)/' "${SHARED_CONFIG}/default.conf"
else
    echo "Environment is not 'dev'; not adding the debug toolbar route."
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
    echo "Blocked IPs configuration created."
fi

echo "Configuration files ready in ${SHARED_CONFIG}:"
ls -la "${SHARED_CONFIG}/"