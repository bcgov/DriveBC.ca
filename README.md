[![Lifecycle:Experimental](https://img.shields.io/badge/Lifecycle-Experimental-339999)](https://github.com/bcgov/repomountie/blob/master/doc/lifecycle-badges.md)

# DriveBC public website

The DriveBC application is composed of several [Docker](https://www.docker.com/) containers:
[Django](https://www.djangoproject.com/) backend, [PostGIS](http://postgis.net/) database, [Redis](https://redis.io/) cache, and a frontend application built using [React](https://react.dev/) served on [Node.js](https://nodejs.org/en).

- [Quickstart](#quickstart)
- [Environment configuration](#environment-configuration)
- [Development setup](#development-setup)
  - [Prerequisites](#prerequisites)
  - [Pre-commit](#pre-commit) hooks
  - [Backend setup](#backend-setup)
  - [Frontend setup](#frontend-setup)

---

## <a name="quickstart"></a>Quickstart
1. Install [Docker Desktop](https://docs.docker.com/compose/install/) for your OS[**](#first-asterisk)
2. Clone or download the project
3. Setup [environment variables](#environment-configuration)
4. Run docker-compose, 'cd DriveBC.ca && docker-compose up -d --build'
5. The following should be reachable:
   - Frontend: http://localhost:3000
   - Backend at http://localhost:8000/, returns 404 as the root url does not serve anything
   - API endpoints at http://localhost:8000/api/*/, i.e. http://localhost:8000/api/webcams/
   - Django admin: http://localhost:8000/drivebc-admin/, use username/password set in .env for login

<a name="first-asterisk"></a>** You will need to install or update to WSL 2 on Windows (wsl --install or wsl --update)

## <a name="environment-configuration"></a>Environment configuration

Environments are configured via environment variables passed to Docker Compose in a .env file.
Copy and rename ".env.example" into ".env" in the same directory and replace values according to your target environment.

<a name="second-asterisk"></a>****Variables with security implications are defaulted to production safe values. Replace or disable them accordingly to
ensure that your local environment runs.**

Secrets and keys:
- `DRIVEBC_ROUTE_PLANNER_API_AUTH_KEY` - Auth key for DriveBC Route Planner API
- `SECRET_KEY` - Secret key for Django backend to create hashes for various security implications. Set to any value for development, or refer to .env.example on random key generation

Django:
- `DEBUG`[**](#second-asterisk) - Enable or disable Django debug mode, set to "true" for development
- `DJANGO_ALLOWED_HOSTS` - Comma-separated list of strings representing the host/domain names that this Django site can serve
- `DJANGO_CORS_ORIGIN_WHITELIST` - Comma-separated list of hosts which are trusted origins for unsafe requests i.e. POST
- `DJANGO_SUPERUSER_USERNAME` - Django superuser username
- `DJANGO_SUPERUSER_EMAIL` - Django superuser email
- `DJANGO_SUPERUSER_PASSWORD` - Django superuser password
- `DJANGO_CSRF_COOKIE_SECURE`[**](#second-asterisk) - See Django [documentation](https://docs.djangoproject.com/en/4.2/ref/settings/#csrf-cookie-secure), set to "false" for development
- `DJANGO_SECURE_SSL_REDIRECT`[**](#second-asterisk) - See Django [documentation](https://docs.djangoproject.com/en/4.2/ref/settings/#secure-ssl-redirect), set to "false" for development
- `DJANGO_SESSION_COOKIE_SECURE`[**](#second-asterisk) - See Django [documentation](https://docs.djangoproject.com/en/4.2/ref/settings/#session-cookie-secure), set to "false" for development
- `DB_NAME` - database name for connection config in django. Use the same value as POSTGRES_DB for development.
- `DB_USER` - database user for connection config in django. Use the same value as POSTGRES_USER for development.
- `DB_PASSWORD` - database password for connection config in django. Use the same value as POSTGRES_PASSWORD for development.
- `DB_HOST`[**](#third-asterisk) - Database host
- `DB_PORT` - Database host port

Postgres:
- `POSTGRES_DB` - Name of default database created when the PostGIS image is first started. See [documentation](https://hub.docker.com/_/postgres).
- `POSTGRES_USER` - Name of superuser created when the PostGIS image is first started. See [documentation](https://hub.docker.com/_/postgres).
- `POSTGRES_PASSWORD` - Password for the user created above. See [documentation](https://hub.docker.com/_/postgres).

Redis:
- `REDIS_HOST`[**](#third-asterisk) - Redis host
- `REDIS_PORT` - Redis host port

Node:
- `NODE_ENV` - Environment for Node.JS server to build against
- `NODE_OPTIONS` - See Node.js [documentation](https://nodejs.org/api/cli.html#node_optionsoptions)

<a name="third-asterisk"></a>** You may run into host/port conflicts with different Postgres or Redis instances if you use 'localhost' and default ports.
To work around this, set the hosts to the name of the instances i.e. DB_HOST=db REDIS_HOST=redis, or  use a different host port in the docker compose file i.e. "8080:5432" for postgres.

## <a name="development-setup"></a>Development Setup

### <a name="pre-commit"></a>Pre commit hooks

Pre-commit hooks run various code formatters and linters. Some (black, prettier) will automatically reformat your code. If you're
using Visual Studio code with the recommended extensions, the pre commit hook formatting should match editor output.

1. Install [pre-commit](https://pre-commit.com/#install) (`brew install pre-commit` using homebrew)
2. Setup the pre-commit and commit message git hooks in the local repository: `pre-commit install --hook-type pre-commit --hook-type commit-msg`

### <a name="backend-setup"></a>Backend setup

See the [Backend README](src/backend/README.md) for details on setting up and building the backend.

### <a name="fronend-setup"></a>Frontend setup

See the [Frontend README](src/frontend/README.md) for details on setting up and building the frontend.

## Release Pipeline
This release pipeline is designed to ensure that 
### Dev
- Push to Main will automatically trigger a build and release to the dev environment
- You can push to dev from a branch, by running the `1. Build & Deploy to Dev` workflow and selecting your branch

### Test
- When you are ready to release to the Test environment, run the `2. Create Tag & Build/Deploy to Test` workflow.
  - It will force you to give a tag number which should be in the format `project year.sprint.version`. Project inception was 2023 which was 0, so a tag would be `1.26.0` for the first release of Sprint 26 in 2024.
  - You can also trigger it by creating a tag using the CLI as long as it starts with `v`
- This workflow will then create the tag and automatically release it to the Test environment. It is based on the code from Main branch

### UAT
- When you are ready to release to the UAT environment, run the `3. Create Tag & Build/Deploy to UAT` workflow.
  - It will force you to give a tag number which should be in semver format and start with `r` to indicate it's a release
  - You can also trigger it by creating a tag (make sure you are on the release branch) using the CLI as long as it starts with `r`
- This workflow will then create the tag and automatically release it to the UAT environment. It is based on the tag you created.

### Prod
- When you are ready to promote from UAT to Prod, we need to create a new Release in Github.
  - Go to the main page https://github.com/bcgov/DriveBC.ca
  - Click Releases
  - Click `Create a new Release`
  - Choose the tag you would like to release (Should start with `r` for release)
  - For Previous Tag, select the tag that is currently in production
  - Click `Generate Release Notes` which will create the release name and add a URL for a changelog
  - Click Publish Release
  - This will automatically trigger the `4. Promote from UAT to Prod` workflow which will promote the UAT images to Prod
