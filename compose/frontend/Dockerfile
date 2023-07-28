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

EXPOSE 3000

ARG DEBUG_BUILD=false

# Add debugging tools into builds if enabled
RUN if [ $DEBUG_BUILD = true ]; then \
  apt update && apt-get install -y jq vim procps less; \
fi

CMD npm start
