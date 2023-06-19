[![Lifecycle:Experimental](https://img.shields.io/badge/Lifecycle-Experimental-339999)](https://github.com/bcgov/repomountie/blob/master/doc/lifecycle-badges.md)

# DriveBC public website

The DriveBC application is composed of several [Docker](https://www.docker.com/) containers:
[Django](https://www.djangoproject.com/) backend, [PostGIS](http://postgis.net/) database, [Redis](https://redis.io/) cache, and a frontend application built using [React](https://react.dev/) served on [Node.js](https://nodejs.org/en).

- [Quickstart](#quickstart)
- [Environment configuration](#environment-configuration)
- [Development setup](#development-setup)
  - [Prerequisites](#prerequisites)
  - [Pre-commit](#pre-commit) hooks
  - [Getting started](#getting-started)

---

## <a name="quickstart"></a>Quickstart
1. Install [Docker Desktop](https://docs.docker.com/compose/install/) for your OS[**](#first-asterisk)
2. Clone or download the project
3. Setup [environment variables](#environment-configuration)
4. Run docker-compose, 'cd DriveBC.ca && docker-compose up -d --build'
5. The following should be reachable:
   - Frontend: http://localhost:3000
   - Backend at http://localhost:8000/, returns 404 as the root url does not serve anything
   - API endpoints at http://localhost:8000/api/*/v1/, i.e. http://localhost:8000/api/webcams/v1/
   - Django admin: http://localhost:8000/drivebc-admin/, use username/password set in .env for login

<a name="first-asterisk"></a>** You will need to install or update to WSL 2 on Windows (wsl --install or wsl --update)


## <a name="environment-configuration"></a>Environment configuration

Environments are configured via environment variables passed to Docker Compose in a .env file.
Copy and rename ".env.example" into ".env" in the same directory and replace all sample values in angle brackets <>.

<a name="second-asterisk"></a> ** You may run into host/port conflicts with different Postgres or Redis instances if you use 'localhost' and default ports.
To work around this, set the hosts to the name of the instances i.e. DB_HOST=db REDIS_HOST=redis, or  use a different host port in the docker compose file i.e. "8080:5432" for postgres.

Secrets and keys:
- `DRIVEBC_ROUTE_PLANNER_API_AUTH_KEY` - Auth key for DriveBC Route Planner API
- `SECRET_KEY` - Secret key for Django backend to create hashes for various security implications. Set to any value for development, or refer to .env.example on random key generation

Django:
- `DEBUG` - Enable or disable Django debug mode, set to "true" for development
- `DJANGO_ALLOWED_HOSTS` - Comma-separated list of strings representing the host/domain names that this Django site can serve
- `DJANGO_CORS_ORIGIN_WHITELIST` - Comma-separated list of hosts which are trusted origins for unsafe requests i.e. POST
- `DJANGO_SUPERUSER_USERNAME` - Django superuser username
- `DJANGO_SUPERUSER_EMAIL` - Django superuser email
- `DJANGO_SUPERUSER_PASSWORD` - Django superuser password
- `DJANGO_CSRF_COOKIE_SECURE` - See Django [documentation](https://docs.djangoproject.com/en/4.2/ref/settings/#csrf-cookie-secure), set to "false" for development
- `DJANGO_SECURE_SSL_REDIRECT` - See Django [documentation](https://docs.djangoproject.com/en/4.2/ref/settings/#secure-ssl-redirect), set to "false" for development
- `DJANGO_SESSION_COOKIE_SECURE` - See Django [documentation](https://docs.djangoproject.com/en/4.2/ref/settings/#session-cookie-secure), set to "false" for development
- `DB_HOST` - Database host**
- `DB_PORT` - Database host port**

Postgres:
- `POSTGRES_DB` - Database name
- `POSTGRES_USER` - Database user
- `POSTGRES_PASSWORD` - Database password

Redis:
- `REDIS_HOST` - Redis host[**](#second-asterisk)
- `REDIS_PORT` - Redis host port[**](#second-asterisk)

Node:
- `NODE_ENV` - Environment for Node.JS server to build against
- `NODE_OPTIONS` - See Node.js [documentation](https://nodejs.org/api/cli.html#node_optionsoptions)

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
