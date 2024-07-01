# SwissGeol Asset

## Development

The following components must be installed on the development computer:

✔️ Git  
✔️ Docker  
✔️ Node.js 20 LTS

### Setting Up the Development Environment

Follow these steps to set up the development environment on your local machine:

- [1. Configure Local Systems](#1-Configure-Local-Systems)
- [3. Install Dependencies](#2-Install-Dependencies)
- [4. Generate Database Types](#3-Generate-Database-Types)
- [5. Initialize MinIO](#4-Initialize-MinIO)

#### 1. Configure Local Systems

Configure `development/.env` according to the [local service configuration](#Local-Service-Configuration).

#### 2. Install Dependencies

Install node modules:

```bash
npm install
```

#### 3. Generate Database Types

Generate prisma-client for database-access:

```bash
npm run prisma -- generate
```

#### 4. Initialize MinIO

- [Start the development services](#Starting-the-Development-Environment).
- Open http://localhost:9001
- Sign in using the `STORAGE_USER` and `STORAGE_PASSWORD` of your development environment.
- Navigate to [Buckets](http://localhost:9001/buckets) and create a new bucket with the name `asset-sg`.
- Navigate to [the new bucket's browser](http://localhost:9001/browser/asset-sg) and create an empty folder with the name `asset-sg`.
- Navigate to [Configuration](http://localhost:9001/settings/configurations/region) and change the server region to `local`.
- Navigate to [Access Keys](http://localhost:9001/access-keys) and create a new access key.
- Open the file [`apps/server-asset-sg/.env.local`](apps/server-asset-sg/.env.local) and modify the following variables:
  - Set `S3_ACCESS_KEY_ID` to your generated access key.
  - Set `S3_SECRET_ACCESS_KEY` to your generated access key's secret.

### Starting the Development Environment

Start development services:

```bash
cd development
docker compose up
```

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

### Importing Example Data

You can dump data from a remote environment into a local file so you can initialize your development database with it.
To do so, use the following commands.
Be aware that you need to manually insert the `{DB_*}` values beforehand.

```bash
cd development
docker compose exec db sh -c 'pg_dump --dbname=postgresql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:5432/{DB_DATABASE} --data-only --exclude-table asset_user --exclude-table _prisma_migrations -n public > /dump.sql'
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
npm run prisma -- migrate deploy

# Import example data:
cd development
docker compose exec db sh -c 'psql --dbname=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB} -f /dump.sql'
```

> You will need to manually sync the data to Elasticsearch via the admin panel in the web UI.

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

### Asset Server Configuration

The file `apps/server-asset-sg/.env.local` configures secrets for the SwissGeol Asset server.
An empty template for the file can be found in [`apps/server-asset-sg/.env.template`](apps/server-asset-sg/.env.template).

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

> The local docker configuration contains an OIDC container supporting OAuth.
> Use the example values to use it instead of an external issuer.

### Local Service Configuration

The file `development/.env` configures secrets for the services used in local development.
An empty template for the file can be found in [`development/.env.template`](development/.env.template).

> Make sure that your passwords have a minimal length of 8 and contain at combination of
> upper, lower and special characters. Some of the passwords will be checked for validity during startup.

| Variable         | Wert     | Beschreibung                           |
| ---------------- | -------- | -------------------------------------- |
| STORAGE_USER     | _custom_ | Username for the MinIO container.      |
| STORAGE_PASSWORD | _custom_ | Password for the MinIO container.      |
| DB_USER          | postgres | Username for the PostgreSQL container. |
| DB_PASSWORD      | _custom_ | Password for the PostgreSQL container. |
| PGADMIN_EMAIL    | _custom_ | Email for the PgAdmin container.       |
| PGADMIN_PASSWORD | _custom_ | Password for the PgAdmin container.    |

## Database ORM

This project uses [Prisma](https://www.prisma.io/) as its database ORM.
The schema can be found at [apps/server-asset-sg/prisma/schema.prisma](./apps/server-asset-sg/prisma/schema.prisma).

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

To create a new migration, first modify [the Prisma schema](./apps/server-asset-sg/prisma/schema.prisma).
Then, create a [shadow database](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/shadow-database):

```bash
docker compose exec db sh -c 'psql --dbname=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB} -c "CREATE DATABASE postgres_shadow;"
```

Afterward, you can generate the new migration:

```bash
npm run prisma -- migrate dev --create-only
```

You can find and modify your new migration within [the `migrations/` directory](./apps/server-asset-sg/prisma/migrations/).
The finalized migration can be applied like any other migration:

```bash
npm run prisma -- migrate deploy
```

### Deploying migrations

Migrations are automatically applied to any environment running the [swissgeol-assets-api Docker image](https://github.com/swisstopo/swissgeol-assets-suite/pkgs/container/swissgeol-assets-api).
