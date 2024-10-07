import { PrismaClient } from '@prisma/client';
import { ExportToViewService, getConfig, log, prismaConfig, resetAndMigrateDatabase } from './core';

log('Starting data export to view');

const config = getConfig();
log(`Found configuration ${JSON.stringify(config)}`);

// Reset and migrate destination database
resetAndMigrateDatabase(config.destination.connectionString);

const sourcePrisma = new PrismaClient(prismaConfig(config.source.connectionString));
const destinationPrisma = new PrismaClient(prismaConfig(config.destination.connectionString));

// Export data from source to destination database
const exportToViewService = new ExportToViewService(sourcePrisma, destinationPrisma, config);
exportToViewService
  .exportToView()
  .then(() => log('Export to view completed'))
  .catch((error) => console.error(error));
