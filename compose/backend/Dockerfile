# Use an official Python runtime as a parent image
FROM python:3.13-slim

# Install only what you need, clean up apt caches in one RUN
RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \
      binutils \
      libproj-dev \
      gdal-bin \
      curl \
      ca-certificates \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Adding backend directory to make absolute filepaths consistent across services
WORKDIR /app/backend

# Install Python dependencies
COPY ./src/backend/requirements /app/backend/requirements
RUN pip install --no-cache-dir -r requirements/development.txt

COPY ./compose/backend/entrypoint /
RUN sed -i 's/\r$//g' /entrypoint && chmod +x /entrypoint

COPY ./compose/backend/start.sh /
RUN sed -i 's/\r$//g' /start.sh && chmod +x /start.sh

COPY ./compose/backend/start_tasks.sh /
RUN sed -i 's/\r$//g' /start_tasks.sh && chmod +x /start_tasks.sh

# Add the rest of the code
COPY ./src/backend /app/backend
COPY ./compose/backend/.vimrc /
COPY ./compose/backend/.vimrc /root

# Create static and media folders with rw permissions
RUN mkdir -p /app/static && chgrp -R 0 /app/static && chmod -R g=u /app/static && chmod 775 /app/static
RUN mkdir -p /app/media && chgrp -R 0 /app/media && chmod -R g=u /app/media && chmod 775 /app/media

ARG DEBUG_BUILD=false

# Add debugging tools into builds if enabled
RUN if [ "$DEBUG_BUILD" = "true" ]; then \
      apt-get update && \
      DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        jq \
        vim \
        procps \
        less && \
      rm -rf /var/lib/apt/lists/*; \
    fi
ENTRYPOINT ["/entrypoint"]

# Make port 8000 available for the app
EXPOSE 8000
