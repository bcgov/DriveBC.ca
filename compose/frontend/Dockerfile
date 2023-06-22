# Use an official node runtime as a parent image
FROM node:latest

WORKDIR /app/
RUN chown node:root /app

# Install dependencies
COPY package.json /app/

RUN npm install

# Add rest of the client code
COPY . /app/
RUN chown node:root /app/node_modules

EXPOSE 3000

# OpenShift runs as node, not as root (while docker runs as root), so need to
# ensure running user can write to its home directory--without setting this,
# home is /, so node can't create a cache dir
ENV HOME /home/node

CMD npm start
