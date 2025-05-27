import { PrismaClient } from '@prisma/client';
import {
  ExportToViewService,
  getConfig,
  log,
  maskSecrets,
  prismaConfig,
  resetAndMigrateDatabase,
  SyncExternService,
} from './core';

log('Starting data export to view', 'main');

const config = getConfig();
log(`Found configuration ${JSON.stringify(maskSecrets(config))}`, 'main');

const sourcePrisma = new PrismaClient(prismaConfig(config.source.connectionString));
const destinationPrisma = new PrismaClient(prismaConfig(config.destination.connectionString));

switch (config.mode) {
  case 'view':
    // Reset and migrate destination database
    resetAndMigrateDatabase(config.destination.connectionString);
    // Export data from source to destination database
    new ExportToViewService(sourcePrisma, destinationPrisma, config)
      .exportToView()
      .then(() => log('Export to view completed', 'main'))
      .catch((error) => console.error(error));
    break;
  case 'extern':
    new SyncExternService(sourcePrisma, destinationPrisma, config)
      .syncProdAndExtern()
      .then(() => log('Export to extern completed', 'main'))
      .catch((error) => console.error(error));
    break;
  default:
    throw new Error(`Unknown mode: ${config.mode}`);
}
