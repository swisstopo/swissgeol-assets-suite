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
6. Creating elastic-search index. Execute in Kibana (`http://localhost:5601/app/dev_tools#/console`) the commands fro file `web-asset-swissgeol\development\init\elasticsearch\index`. --> docker must be started (see below)

### Starting the development environment

1. Start docker with `web-asset-swissgeol\development>docker-compose up`.
2. Start assets-app with `web-asset-swissgeol>npm run start`.

**The following services/applications are then available**

| 🔖 App/Service           | 🔗Link                                           | 🧞User               | 🔐Password              |
| :---------------------- --| :------------------------------------------------| :---------------------| :---------------------- |
| Assets  (client)          | [localhost:4200](http://localhost:4200/)         | `admin@assets.sg`     | `adminAssets`           |
| Assets REST API  (server) | [localhost:3333/api/](http://localhost:3333/api) | n/a                   | n/a                     |
| postgresSQL (docker)      | localhost:5432                                   | .env `$DB_USER`       |.env `$DB_PASSWORD`      |
| Elasticsearch (docker)    | [localhost:9200](http://localhost:9200)          | n/a                   | n/a                     |
| Kibana (docker)           | [localhost:5601](http://localhost:5601)          | n/a                   | n/a                     |
| pgAdmin (docker)          | [localhost:5051](http://localhost:5051/)         | .env `$PGADMIN_EMAIL` |.env `$PGADMIN_PASSWORD` |
| MinIO (docker)            | [localhost:9001](http://localhost:9001/)         | .env `$STORAGE_USER`  |.env `$STORAGE_PASSWORD` |
| smtp4dev (docker)         | [localhost:5000](http://localhost:5000/)         | n/a                   | n/a                     |

### Creating elastic-search index



### Commands in development environment

| Action | Command                              | Description                               |
| :------| :------------------------------------| :-----------------------------------------|
| start  | `web-asset-swissgeol> npm run start` | Starts asset-client and asset-api.        | 
| build  | `web-asset-swissgeol> npm run build` | Builds asset-client and asset-api.        | 
| test   | `web-asset-swissgeol> npm run test`  | Executes tests all apps and libs.         | 
| lint   | `web-asset-swissgeol> npm run lint`  | Analyzes the code from all apps and libs. | 
