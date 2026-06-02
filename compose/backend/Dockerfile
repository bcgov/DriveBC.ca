# This is intended for the production image. For development, see Dockerfile.dev
# ==========================================
# STAGE 1: Build
# ==========================================
FROM python:3.13-slim AS builder

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
# STAGE 2: Final Runtime
# ==========================================
FROM python:3.13-slim AS runner

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
 && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql17 \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

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