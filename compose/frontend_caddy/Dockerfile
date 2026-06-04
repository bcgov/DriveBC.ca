# syntax=docker/dockerfile:1

############################################
# Builder: Frontend (Same as before)       #
############################################
FROM node:24-alpine AS buildnode
WORKDIR /app/
COPY ./src/frontend/package.json ./src/frontend/package-lock.json ./src/frontend/.npmrc ./
RUN --mount=type=secret,id=FONTAWESOME_PACKAGE_TOKEN \
    test -s /run/secrets/FONTAWESOME_PACKAGE_TOKEN || { echo "FONTAWESOME_PACKAGE_TOKEN secret missing"; exit 1; }; \
    export FONTAWESOME_PACKAGE_TOKEN="$(cat /run/secrets/FONTAWESOME_PACKAGE_TOKEN)" && \
    npm ci
COPY ./src/frontend/ /app/
RUN npm run openshift_build

############################################
# Builder: Custom Caddy with Redis & Cache #
############################################
FROM caddy:2.11-builder-alpine AS caddy-builder
RUN xcaddy build \
    --with github.com/caddyserver/cache-handler \
    --with github.com/darkweak/storages/redis/caddy

############################################
# Runtime: Caddy serving assets            #
############################################
FROM caddy:2.11-alpine

# Install compression tools for the runtime injection script
RUN apk add --no-cache brotli gzip bash

# Caddy usually runs on 80/443, but we match your Nginx config
EXPOSE 3000

# Copy Cache Handler plugin from builder
COPY --from=caddy-builder /usr/bin/caddy /usr/bin/caddy

# OpenShift strips binary capabilities, so we clear the default setcap
RUN apk add --no-cache libcap && setcap -r /usr/bin/caddy || true

# Make essential directories writable by the OpenShift dynamic user (Group 0)
RUN chmod -R g=u /data /config /etc/caddy

# Set up directories for OpenShift (non-root)
RUN mkdir -p /config/caddy /data/caddy /etc/caddy /usr/share/caddy/html /logs && \
    chmod -R 777 /config/caddy /data/caddy /etc/caddy /logs

# Copy built assets
COPY --from=buildnode /app/build /usr/share/caddy/html

# Copy Caddyfile and supporting configs
COPY ./compose/frontend_caddy/Caddyfile /etc/caddy/Caddyfile
# Note: legacy_redirects and blocked_ips should be converted or handled in Caddyfile

# Copy injection script
COPY --chmod=755 ./compose/frontend_caddy/generate-config.sh /tmp/generate-config.sh

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]