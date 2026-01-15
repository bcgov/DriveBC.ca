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

# 1. COPY ALL FILES TO SHARED VOLUME
# We copy the entire html root (index.html, assets/, etc) to the shared folder
echo "Copying /usr/share/nginx/html/ to ${SHARED_CONFIG}..."
cp -r /usr/share/nginx/html/* "${SHARED_CONFIG}/"

# 2. PREPARE THE CONFIG BLOCK
# Create the temporary file with the script tag. 
# We do NOT need to remove newlines or escape special characters here anymore.
cat > "${SHARED_CONFIG}/config_snippet.html" <<EOF
<script>
window.__ENV__ = {
  BASE_MAP: '${REACT_APP_BASE_MAP}',
  MAP_STYLE: '${REACT_APP_MAP_STYLE}',
  API_HOST: '${REACT_APP_API_HOST}',
  REPORT_WMS_LAYER: '${REACT_APP_REPORT_WMS_LAYER}',
  GEOCODER_HOST: '${REACT_APP_GEOCODER_HOST}',
  GEOCODER_API_CLIENT_ID: '${REACT_APP_GEOCODER_API_CLIENT_ID}',
  ROUTE_PLANNER: '${REACT_APP_ROUTE_PLANNER}',
  ROUTE_PLANNER_CLIENT_ID: '${REACT_APP_ROUTE_PLANNER_CLIENT_ID}',
  REPLAY_THE_DAY: '${REACT_APP_REPLAY_THE_DAY}',
  SURVEY_LINK: '${REACT_APP_SURVEY_LINK}',
  BCEID_REGISTER_URL: '${REACT_APP_BCEID_REGISTER_URL}',
  FROM_EMAIL: '${REACT_APP_FROM_EMAIL}',
  LEGACY_URL: '${REACT_APP_LEGACY_URL}',
  RECAPTCHA_CLIENT_ID: '${REACT_APP_RECAPTCHA_CLIENT_ID}',
  ALTERNATE_ROUTE_GDF: '${REACT_APP_ALTERNATE_ROUTE_GDF}',
  ALTERNATE_ROUTE_TURNCOST: '${REACT_APP_ALTERNATE_ROUTE_TURNCOST}',
  ALTERNATE_ROUTE_XINGCOST: '${REACT_APP_ALTERNATE_ROUTE_XINGCOST}',
  DEPLOYMENT_TAG: '${DEPLOYMENT_TAG}',
  RELEASE: '${RELEASE:-}'
};
</script>
EOF

# 3. INJECT INTO INDEX.HTML
TARGET_INDEX="${SHARED_CONFIG}/index.html"
SNIPPET_FILE="${SHARED_CONFIG}/config_snippet.html"

echo "Injecting runtime config into ${TARGET_INDEX}..."

# EXPLANATION:
# /<head>/ finds the line containing the <head> tag.
# r reads the content of config_snippet.html and appends it AFTER that line.
sed -i "/<head>/r ${SNIPPET_FILE}" "$TARGET_INDEX"

# 4. RE-COMPRESS INDEX.HTML
# The old index.html.gz is now stale because we modified the html.
echo "Re-compressing index.html..."
rm "${TARGET_INDEX}.gz"
gzip -9 -k "$TARGET_INDEX"

# Cleanup temp file
rm "${SHARED_CONFIG}/config_snippet.html"

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