# DriveBC Frontend

This page details the frontend development setup.

- [Prerequisites](#prerequisites)
- [Optional local setup](#optional-local-setup)
- [Styleguide](#styleguide)

---

## <a name="prerequisites"></a>Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/)
- [Node.js](https://nodejs.org/en), optional for local environment

## <a name="optional-local-setup"></a>Optional local setup

Our Docker images innately supports hot-reloading on code changes and is the preferred setup for frontend development. Follow the quickstart guide on the root readme for setup instructions.

Alternatively, follow the steps below to set up a local Node.js server for development. Technically, the frontend does not need any other service to start, but a lot of pages and components will require data from the backend APIs to function normally.

1. Install [Node.js](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
2. Install node modules `cd src/frontend/ && npm install`. See [documentation](https://docs.npmjs.com/downloading-and-installing-packages-locally) on Node packages.
3. Start node server `npm start`

## <a name="styleguide"></a>Styleguide

A style guide is accessible at `/StylesPage`, in StylesPage.js.
