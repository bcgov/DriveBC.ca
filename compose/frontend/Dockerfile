# Use an official node runtime as a parent image
FROM node:22-slim

WORKDIR /app/
RUN chown node:root /app

# Install dependencies
COPY ./src/frontend/package.json /app/
COPY ./src/frontend/package-lock.json /app/
COPY ./src/frontend/.npmrc /app/
ARG FONTAWESOME_PACKAGE_TOKEN
RUN npm install

# Add rest of the client code
COPY ./src/frontend /app/
COPY ./.env /app/
RUN chown node:root /app/node_modules

EXPOSE 3000

ARG DEBUG_BUILD=false

# Add debugging tools into builds if enabled
RUN if [ ${DEBUG_BUILD} = true ]; then \
  apt update && apt-get install -y jq vim procps less; \
fi

CMD npm start
