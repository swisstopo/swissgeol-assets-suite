# Assets

## Setting up the development environment

The following components must be installed on the development computer:

✔️ Git  
✔️ Docker  
✔️ Node.js 20 LTS

The following steps must be carried out once:

1. Install all necessary modules with `web-asset-swissgeol> npm install`.
2. Decorate the Angular CLI with the Nx CLI `web-asset-swissgeol> npm run postinstall`.
2. Create prisma-client for database-access with `web-asset-swissgeol\apps\server-asset-sg> ng gen-prisma-client`.
3. Set environment variables for dockers in `web-asset-swissgeol\development\.env`
4. Set environment variables for assets-server in `web-asset-swissgeol\apps\server-asset-sg\.env.local`
5. Create local postgis-gotrue docker-image `development\images\db> docker build -t postgis-gotrue .`

### Starting the development environment

1. Start docker with `web-asset-swissgeol\development>docker-compose up`.
2. Start assets-app with `web-asset-swissgeol>npm run start`.

**The following services/applications are then available**

| 🔖 Dienst/Anwendung    | 🔗Adresse                                       | 🧞Benutzername        | 🔐Passwort              |
| :----------------------| :------------------------------------------------| :---------------------| :---------------------- |
| Assets                 | [localhost:4200](http://localhost:4200/)         | `admin@assets.sg`     | `adminAssets`           |
| Assets REST API        | [localhost:3333/api/](http://localhost:3333/api) | n/a                   | n/a                     |
| postgresSQL (docker)   | localhost:5432                                   | .env `$DB_USER`       |.env `$DB_PASSWORD`      |
| Elasticsearch (docker) | [localhost:9200](http://localhost:9200)          | n/a                   | n/a                     |
| Kibana (docker)        | [localhost:5601](http://localhost:5601)          | n/a                   | n/a                     |
| pgAdmin (docker)       | [localhost:5051](http://localhost:5051/)         | .env `$PGADMIN_EMAIL` |.env `$PGADMIN_PASSWORD` |
| MinIO (docker)         | [localhost:9001](http://localhost:9001/)         | .env `$STORAGE_USER`  |.env `$STORAGE_PASSWORD` |
| smtp4dev (docker)      | [localhost:5000](http://localhost:5000/)         | n/a                   | n/a                     |

### Creating elastic-search index

1. Execute in Kibana (`http://localhost:5601/app/dev_tools#/console`) the commands fro file `web-asset-swissgeol\development\init\elasticsearch\index`.
 