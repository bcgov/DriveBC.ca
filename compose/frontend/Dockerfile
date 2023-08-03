# Use an official node runtime as a parent image
FROM node:latest

WORKDIR /app/
RUN chown node:root /app

# Install dependencies
COPY ./src/frontend/package.json /app/

RUN npm install

# Add rest of the client code
COPY ./src/frontend /app/
RUN chown node:root /app/node_modules

ARG API_HOST
ENV REACT_APP_API_HOST=${API_HOST}
ARG BASE_MAP
ENV REACT_APP_BASE_MAP=${BASE_MAP}
ARG MAP_STYLE
ENV REACT_APP_MAP_STYLE=${MAP_STYLE}
ARG HIGHWAY_LAYER
ENV REACT_APP_HIGHWAY_LAYER=${HIGHWAY_LAYER}
ARG OPEN511_LAYER
ENV REACT_APP_OPEN511_LAYER=${OPEN511_LAYER}

EXPOSE 3000

ARG DEBUG_BUILD=false

# Add debugging tools into builds if enabled
RUN if [ $DEBUG_BUILD = true ]; then \
  apt update && apt-get install -y jq vim procps less; \
fi

CMD npm start
