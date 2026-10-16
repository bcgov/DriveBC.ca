# This is intended for the production image. For development, see Dockerfile.dev
# ==========================================
# STAGE 1: Build
# ==========================================
FROM python:3.14-slim AS builder

# Install system dependencies + compilers needed to build Python wheels
RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      binutils \
      libproj-dev \
      gdal-bin \
      curl \
      ca-certificates \
      gnupg2 \
      apt-transport-https \
      unixodbc-dev \
      gcc \
      g++ \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# Install Python dependencies into a local virtual environment
# This makes it incredibly easy to copy to the next stage
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY ./src/backend/requirements /app/backend/requirements
RUN pip install --no-cache-dir -r requirements/requirements.txt


# ==========================================
# STAGE: Compile patched America/Vancouver
# TEMPORARY STAGE: This is to support the PCT timezone code for Vancouver, BC. This is a temporary stage until the IANA timezone database is updated to include this change.
# ==========================================
FROM alpine:3.24 AS tzbuild
RUN apk add --no-cache build-base curl
WORKDIR /tz

RUN curl -fsSLO https://data.iana.org/time-zones/releases/tzcode2026e.tar.gz \
 && curl -fsSLO https://data.iana.org/time-zones/releases/tzdata2026e.tar.gz \
 && tar -xzf tzcode2026e.tar.gz \
 && tar -xzf tzdata2026e.tar.gz \
 && make zic

# Vancouver: final "-7:00 - MST" -> PCT
RUN sed -i '/^Zone America\/Vancouver/,/^Zone America\/Dawson_Creek/ s/^\([[:space:]]*-7:00[[:space:]]*-[[:space:]]*\)MST/\1PCT/' northamerica \
 && sed -n '/^Zone America\/Vancouver/,/^Zone America\/Dawson_Creek/p' northamerica | grep -q 'PCT'

# Edmonton: final "-6:00 - CST" -> MDT
RUN sed -i '/^Zone America\/Edmonton/,/^Zone America\/Vancouver/ s/^\([[:space:]]*-6:00[[:space:]]*-[[:space:]]*\)CST/\1MDT/' northamerica \
 && sed -n '/^Zone America\/Edmonton/,/^Zone America\/Vancouver/p' northamerica | grep -qE '^[[:space:]]*-6:00[[:space:]]+-[[:space:]]+MDT'

# Compile both patches
RUN ./zic -b fat -d /out -L /dev/null northamerica


# ==========================================
# STAGE 2: Final Runtime
# ==========================================
FROM python:3.14-slim AS runner

RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      binutils \
      libproj-dev \
      gdal-bin \
      curl \
      ca-certificates \
      gnupg2 \
      apt-transport-https \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /usr/share/keyrings/microsoft-prod.gpg \
 && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/mssql-release.list \
 && apt-get update \
 && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# --- Temporary timezone patch for Vancouver, BC --- 
COPY --from=tzbuild /out/America/Vancouver /usr/share/zoneinfo/America/Vancouver
COPY --from=tzbuild /out/America/Edmonton  /usr/share/zoneinfo/America/Edmonton
# --- End Temporary timezone patch for Vancouver, BC ---

WORKDIR /app/backend

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY ./compose/backend/entrypoint \
     ./compose/backend/start.sh \
     ./compose/backend/start_tasks.sh \
     ./compose/backend/start_tasks_openshift.sh \
     ./compose/backend/leader-election.py \
     ./compose/backend/start_consumer.sh /

RUN sed -i 's/\r$//g' /entrypoint /start.sh /start_tasks.sh /start_tasks_openshift.sh /leader-election.py /start_consumer.sh \
 && chmod +x /entrypoint /start.sh /start_tasks.sh /start_tasks_openshift.sh /leader-election.py /start_consumer.sh

COPY ./src/backend /app/backend

RUN mkdir -p /app/static /app/media \
 && chgrp -R 0 /app/static /app/media \
 && chmod -R g=u /app/static /app/media \
 && chmod 775 /app/static /app/media

EXPOSE 8000
ENTRYPOINT ["/entrypoint"]