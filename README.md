# assets.swissgeol.ch

Web application for the simple, structured and harmonized recording of geological assets.

This document contains very broad information to get the project up and running; for more specific information, please refer to the [Developer Docs](DEVELOPER_DOCS.md) and the [Release Process](RELEASE_PROCESS.md).

## Development

The following components must be installed on the development computer:

✔️ Git  
✔️ Docker  
✔️ Node.js 22 LTS

### Setting Up the Development Environment

Follow these steps to set up the development environment on your local machine:

- [1. Install Dependencies](#2-Install-Dependencies)
- [2. Generate Database Types](#3-Generate-Database-Types)
- [3. Initialize MinIO](#4-Initialize-MinIO)

#### 1. Install Dependencies

Install node modules:

```bash
npm install
```

#### 2. Generate Database Types

Generate prisma-client for database-access:

```bash
npm run prisma -- generate
```

#### 3. MinIO & OCR

Files are stored in a local MinIO instance which is accessed by the backend, frontend and OCR service using an access key with a "god" policy. The `createbuckets` service is used to create the storage as well as the access keys, so you should not have to worry about that.

If you need to change the user or password, be sure to

- Adjust the environment variables in `development/.env` and, if need be, the directory parameters in `docker-compose.yaml`
- Adjust the environment variables in `apps-server-sg/.env` so they match the changes to docker compose

#### 4. Define Admin User

Per default, our user is not an admin and cannot access admin functionality. In order to so, login once and then manually set the user to admin in the database directly:

```bash
docker compose exec db sh -c 'psql --dbname=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB} -c "UPDATE asset_user SET is_admin = true WHERE email = '\''admin@assets.swissgeol.ch'\''"'
```

### Starting the Development Environment

Start development services:

```bash
cd development
docker compose up
```

> **Important:** make sure that both `development/volumes/elasticsearch` and `development/volumes/pgadmin` are writable by the container user, otherwise the elasticsearch and pgadmin container will be stuck in an infinite boot loop.

Start the application:

```bash
npm run start

# Or individually:
npm run start:server
npm run start:client
```

### Local Services and Applications

| 🔖App/Service            | 🔗Link                                           | 🧞User                | 🔐Password               |
| :----------------------- | :----------------------------------------------- | :-------------------- | :----------------------- |
| Assets (client)          | [localhost:4200](http://localhost:4200/)         | `admin`               | `admin`                  |
| Assets REST API (server) | [localhost:3333/api/](http://localhost:3333/api) | n/a                   | n/a                      |
| postgreSQL (docker)      | localhost:5432                                   | .env `$DB_USER`       | .env `$DB_PASSWORD`      |
| Elasticsearch (docker)   | [localhost:9200](http://localhost:9200)          | n/a                   | n/a                      |
| Kibana (docker)          | [localhost:5601](http://localhost:5601)          | n/a                   | n/a                      |
| pgAdmin (docker)         | [localhost:5051](http://localhost:5051/)         | .env `$PGADMIN_EMAIL` | .env `$PGADMIN_PASSWORD` |
| MinIO (docker)           | [localhost:9001](http://localhost:9001/)         | .env `$STORAGE_USER`  | .env `$STORAGE_PASSWORD` |
| smtp4dev (docker)        | [localhost:5000](http://localhost:5000/)         | n/a                   | n/a                      |
| oidc-server (docker)     | [localhost:4011](http://localhost:4011/)         | n/a                   | n/a                      |
| createbuckets (docker)   | n/a                                              | n/a                   | n/a                      |

### Importing Example Data

You can dump data from a remote environment into a local file so you can initialize your development database with it.
To do so, use the following commands.
Be aware that you need to manually insert the `{DB_*}` values beforehand.

```bash
cd development
docker compose exec db sh -c 'pg_dump --dbname=postgresql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:5432/{DB_DATABASE} --data-only --exclude-table _prisma_migrations --exclude-table asset_test --exclude-table asset_user_bak -n public > /dump.sql'
```

> The export will output warnings related to circular foreign-key constraints.
> These can be safely ignored.

> The export will only contain the database's data, not its structure.
> Data related to the authentication process is also excluded,
> so we don't run into conflicts when using a different eIAM provider.

To import the dumped data, run the following commands.
Ensure to start your database service beforehand.

```bash
# Reset the database:
npm run prisma -- migrate reset -f

# Switch to the directory containing the database's `docker-compose.yml`:
cd development

# Remove the initial workgroup as it will collide with the import:
docker compose exec db sh -c 'psql --dbname=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB} -c "DELETE FROM workgroup"'

# Import example data:
docker compose exec db sh -c 'psql --dbname=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB} -v ON_ERROR_STOP=1 -f /dump.sql -f /docker-entrypoint-initdb.d/01_roles.sql'
```

> You will need to manually sync the data to Elasticsearch via the admin panel in the web UI via the cogwheel symbol in the bottom left of the GUI (requires `is_admin` to be true for the given user).

## Testing

> Tests execute automatically on every push to the Git repository.

The local tests require a running instance of both _postgreSQL_ and _Elasticsearch_.
Make sure that your local development environment is fully shutdown and then run the test services:

```bash
cd development
docker compose down
docker compose -f docker-compose.test.yml up
```

Then run all tests:

```bash
npm run test
```

It is also possible to run only specific tests:

```bash
# Run only the server tests:
nx run server-asset-sg:test

# Run only a specific test suite:
nx run server-asset-sg:test -t 'AssetRepo'

# Run only a specific, nested test suite:
nx run server-asset-sg:test -t 'AssetRepo create'
```

## Configuration

### Server Configuration

The file `apps/server-asset-sg/.env` configures the configuration for the SwissGeol Assets server.
By default, it is configured to work with the Docker services found in [`development/docker-compose.yml`](development/docker-compose.yml).

| Variable                | Example                                                            | Description                                                         |
| ----------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| FRONTEND_URL            | http://localhost:4200                                              | Public URL of the SwissGeol Asset web client.                       |
| S3_REGION               | local                                                              | Region of the S3 instance.                                          |
| S3_ENDPOINT             | http://localhost:9000                                              | URL to the S3 instance.                                             |
| S3_ACCESS_KEY_ID        | AP6wpeXraSc0IH4d42IN                                               | Access Key for the S3 instance.                                     |
| S3_SECRET_ACCESS_KEY    | fSx5Bfib0OeAyG1mwtslKA04Qj6oPStLcpnkACmF                           | Secret Key for the S3 instance.                                     |
| S3_BUCKET_NAME          | asset-sg                                                           | S3 bucket name.                                                     |
| S3_ASSET_FOLDER         | asset-sg                                                           | Folder within the S3 bucket into which objects are stored.          |
| DATABASE_URL            | postgres://postgres:postgres@localhost:5432/postgres?schema=public | PostgreSQL access URL.                                              |
| OAUTH_ISSUER            | http://localhost:4011                                              | OAuth API URL.                                                      |
| OAUTH_CLIENT_ID         | assets                                                             | Name of the client within the OAuth issuer.                         |
| OAUTH_SCOPE             | openid profile email cognito                                       | The scopes requested on each OAuth login.                           |
| OAUTH_SHOW_DEBUG_INFO   | true                                                               | Whether to show debug info about the OAuth process.                 |
| OAUTH_TOKEN_ENDPOINT    | http://localhost:4011/connect/token                                | The endpoint at which OAuth tokens can be fetched.                  |
| OAUTH_AUTHORIZED_GROUPS | assets.swissgeol                                                   | The name of the groups (comma-separated) which should grant access. |
| OCR_URL                 |                                                                    | Leave empty.                                                        |
| OCR_CALLBACK_URL        |                                                                    | Leave empty.                                                        |

### Services Configuration

The file [`development/.env`](development/.env) configures secrets for the services used in local development.
By default, these secrets align with the server's configuration.

| Variable         | Beschreibung                           |
| ---------------- | -------------------------------------- |
| STORAGE_USER     | Username for the MinIO container.      |
| STORAGE_PASSWORD | Password for the MinIO container.      |
| DB_USER          | Username for the PostgreSQL container. |
| DB_PASSWORD      | Password for the PostgreSQL container. |
| PGADMIN_EMAIL    | Email for the PgAdmin container.       |
| PGADMIN_PASSWORD | Password for the PgAdmin container.    |

```bash
git update-index --no-skip-worktree development/.env
git update-index --no-skip-worktree apps/server-asset-sg/.env.local
```

Then, after having committed your changes, remove them again:

```bash
git update-index --skip-worktree development/.env
git update-index --skip-worktree apps/server-asset-sg/.env.local
```

> Note that worktree modifications need to be committed, just like file changes.

## Database ORM

This project uses [Prisma](https://www.prisma.io/) as its database ORM.
The schema can be found at [libs/persistence/prisma/schema.prisma](libs/persistence/prisma/schema.prisma).

To run prisma commands, you can use the following shortcut:

```bash
npm run prisma -- {command}
```

### Applying migrations

To apply all new migrations to your local database, run the following command:

```bash
npm run prisma -- migrate deploy
```

If your local database's state can't be migrated from, you might have to fully reset your database.
This can happen when manually modifying the database, and will remove all local data.

```bash
npm run prisma -- migrate reset
```

### Creating migrations

To create a new migration, first modify [the Prisma schema](libs/persistence/prisma/schema.prisma).
Then, create a [shadow database](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/shadow-database):

```bash
docker compose exec db sh -c 'psql --dbname=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB} -c "CREATE DATABASE postgres_shadow;"'
```

Afterward, you can generate the new migration:

```bash
npm run prisma -- migrate dev --create-only
```

You can find and modify your new migration within [the `migrations/` directory](libs/persistence/prisma/migrations/).
The finalized migration can be applied like any other migration:

```bash
npm run prisma -- migrate deploy
```

### Deploying migrations

Migrations are automatically applied to any environment running the [swissgeol-assets-api Docker image](https://github.com/swisstopo/swissgeol-assets-suite/pkgs/container/swissgeol-assets-api).

## AI Service Integration

Processing files runs through an external OCR service, followed by data extraction using AI models. The API version can be specified in the server configuration via a class property (or, as is currently the case for OCR, to `undefined`).

Interfaces for the data extraction service can be generated by running:

```bash
npm run generate-interfaces:data-extraction
```

This command fetches the OpenAPI specification from the local data extraction service and generates the interfaces. Note that when the version changes, the command needs to be adjusted as well.

## Versioning

We use [Semantic Versioning](https://semver.org/) for versioning.
The new version number is determined by this [script](./.github/scripts/version.utils.mjs).
Merges to develop will either increase the minor version or the prerelease version based on the previous release version.
Merges to main from develop will increase the minor version if it is not the same as the minor version on develop, otherwise the prerelease version is increased.
Merges to main from hotfix branches will increase the patch version.
Releases to prod will remove the prerelease tag from the release candidate.
