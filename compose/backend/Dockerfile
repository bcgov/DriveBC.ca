# Use an official Python runtime as a parent image
FROM python:latest

# Install Python Package Libraries
RUN apt-get update && apt-get upgrade -y && apt-get autoremove && apt-get autoclean
RUN apt-get install -y binutils libproj-dev gdal-bin

# Adding backend directory to make absolute filepaths consistent across services
WORKDIR /app/backend

# Install Python dependencies
COPY ./src/backend/requirements /app/backend/requirements
RUN pip install -r requirements/development.txt

COPY ./compose/backend/entrypoint /
RUN sed -i 's/\r$//g' /entrypoint && chmod +x /entrypoint

COPY ./compose/backend/start.sh /
RUN sed -i 's/\r$//g' /start.sh && chmod +x /start.sh

# COPY ./compose/backend/worker/start /start-worker
# RUN sed -i 's/\r$//g' /start-worker
# RUN chmod +x /start-worker

# Add the rest of the code
COPY ./src/backend /app/backend

ENTRYPOINT ["/entrypoint"]

# Make port 8000 available for the app
  EXPOSE 8000
