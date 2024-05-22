# SwissGeol Asset

## Development
The following components must be installed on the development computer:

✔️ Git  
✔️ Docker  
✔️ Node.js 20 LTS

### Setting Up the Development Environment
Follow these steps to set up the development environment on your local machine:
* [1. Configure Local Systems](#1-Configure-Local-Systems)
* [2. Configure the Asset Server](#2-Configure-the-Asset-Server)
* [3. Install Dependencies](#3-Install-Dependencies)
* [4. Build Local Systems](#4-Build-Local-Systems)
* [5. Initialize MinIO](#5-Initialize-MinIO)

#### 1. Configure Local Systems
Configure `development/.env` according to the [development services configuration](#Development-Services-Configuration).

#### 2. Configure the Asset Server
Create an empty copy of the [web server configuration](#Asset-Server-Configuration) as [`apps/server-asset-sg/.env.local`](apps/server-asset-sg/.env.local).
Configure the following variables:
* Set `AUTH_URL=http://localhost:8866`.
* Set `FRONTEND_URL=http://localhost:4200`.
* Set `DATABASE_URL=postgres://asset-swissgeol:asset-swissgeol@localhost:5432/postgres?schema=public`.
* Set `GOTRUE_JWT_SECRET` to the same value as in [`development/.env`](development/.env).
* Leave `OCR_URL` empty.
* Leave `OCR_CALLBACK_URL` empty.

#### 3. Install Dependencies
Install node modules:
```bash
npm run install
```

#### 4. Build Local Services
Generate prisma-client for database-access:
```bash
npm run prisma -- generate
```

Build postgis-gotrue docker image:
```bash
cd development/images/db
docker build -t postgis-gotrue .
```

#### 5. Initialize MinIO
* [Start the development services](#Starting-the-Development-Environment).
* Open http://localhost:9001
* Sign in using the `STORAGE_USER` and `STORAGE_PASSWORD` of your development environment.
* Navigate to [Buckets](http://localhost:9001/buckets) and create a new bucket with the name `asset-sg`.
* Navigate to [the new bucket's browser](http://localhost:9001/browser/asset-sg) and create an empty folder with the name `asset-sg`.
* Navigate to [Configuration](http://localhost:9001/settings/configurations/region) and change the server region to `local`.
* Navigate to [Access Keys](http://localhost:9001/access-keys) and create a new access key.
* Open your Asset Server Configuration at [`apps/server-asset-sg/.env.local`](apps/server-asset-sg/.env.local) and make the following changes:
  * `S3_REGION=local`
  * `S3_ENDPOINT=http://localhost:9000`
  * `S3_BUCKET_NAME=asset-sg`
  * `S3_ASSET_FOLDER=asset-sg`
  * `S3_ACCESS_KEY_ID` as your newly generated access key.
  * `S3_SECRET_ACCESS_KEY` as your newly generated access key's secret.

### Starting the Development Environment
Start development services:
```bash
cd development
docker compose up
```
Start the application:
```bash
npm run start
```

### Local Services and Applications
| 🔖App/Service            | 🔗Link                                           | 🧞User                   | 🔐Password               |
|:-------------------------|:-------------------------------------------------|:-------------------------|:-------------------------|
| Assets (client)          | [localhost:4200](http://localhost:4200/)         | `admin@swissgeol.assets` | `swissgeol_assets`       |
| Assets REST API (server) | [localhost:3333/api/](http://localhost:3333/api) | n/a                      | n/a                      |
| postgreSQL (docker)      | localhost:5432                                   | .env `$DB_USER`          | .env `$DB_PASSWORD`      |
| Elasticsearch (docker)   | [localhost:9200](http://localhost:9200)          | n/a                      | n/a                      |
| Kibana (docker)          | [localhost:5601](http://localhost:5601)          | n/a                      | n/a                      |
| pgAdmin (docker)         | [localhost:5051](http://localhost:5051/)         | .env `$PGADMIN_EMAIL`    | .env `$PGADMIN_PASSWORD` |
| MinIO (docker)           | [localhost:9001](http://localhost:9001/)         | .env `$STORAGE_USER`     | .env `$STORAGE_PASSWORD` |
| smtp4dev (docker)        | [localhost:5000](http://localhost:5000/)         | n/a                      | n/a                      |
| oidc-server (docker)     | [localhost:4011](http://localhost:4011/)         | n/a                      | n/a                      |

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

| Variable             | Example                                                                                    | Description                                                |
|----------------------|--------------------------------------------------------------------------------------------|------------------------------------------------------------|
| AUTH_URL             | http://my.gotrue.example:8866                                                              | URL of the GoTrue auth service.                            |
| FRONTEND_URL         | http://assets.geo.admin.ch                                                                 | Public URL of the SwissGeol Asset web client.              |
| S3_REGION            | euw-3                                                                                      | Region of the S3 instance.                                 |
| S3_ENDPOINT          | http://compute-1.amazonaws.com                                                             | URL to the S3 instance.                                    |
| S3_ACCESS_KEY_ID     | AP6wpeXraSc0IH4d42IN                                                                       | Access Key for the S3 instance.                            |
| S3_SECRET_ACCESS_KEY | fSx5Bfib0OeAyG1mwtslKA04Qj6oPStLcpnkACmF                                                   | Secret Key for the S3 instance.                            |
| S3_BUCKET_NAME       | asset-sg                                                                                   | S3 bucket name.                                            |
| S3_ASSET_FOLDER      | asset-sg                                                                                   | Folder within the S3 bucket into which objects are stored. |
| DATABASE_URL         | postgres://asset-swissgeol:asset-swissgeol@my.postgres.example:5432/postgres?schema=public | PostgreSQL access URL.                                     |
| GOTRUE_JWT_SECRET    | 18af41574b30be7539d8c3e45ccdeea9431cff6419cdce5cabc5f28cfb73e15c                           | JWT secret key for the GoTrue server.                      |
| OCR_URL              |                                                                                            | Leave empty.                                               |
| OCR_CALLBACK_URL     |                                                                                            | Leave empty.                                               |


### Development Services Configuration
The file `development/.env` configures secrets for the services used in local development.
An empty template for the file can be found in [`development/.env.template`](development/.env.template).

> Make sure that your passwords have a minimal length of 8 and contain at combination of
> upper, lower and special characters. Some of the passwords will be checked for validity during startup.

| Variable          | Wert     | Beschreibung                             |
|-------------------|----------|------------------------------------------|
| STORAGE_USER      | _custom_ | Username for the MinIO container.        |
| STORAGE_PASSWORD  | _custom_ | Password for the MinIO container.        |
| DB_USER           | postgres | Username for the PostgreSQL container.   |
| DB_PASSWORD       | _custom_ | Password for the PostgreSQL container.   |
| PGADMIN_EMAIL     | _custom_ | Email for the PgAdmin container.         |
| PGADMIN_PASSWORD  | _custom_ | Password for the PgAdmin container.      |
| GOTRUE_JWT_SECRET | _custom_ | JWT Secret Key for the GoTrue container. |
