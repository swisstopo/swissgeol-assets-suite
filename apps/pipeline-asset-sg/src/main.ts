import { ExportToViewService } from './export-to-view.service';
import { resetAndMigrateDatabase } from './reset-and-migrate-database';
import { log } from './log';
import { PrismaClient } from '@prisma/client';
import { prismaConfig } from './utils';
import { config } from './config';

log('Starting data export to view');
log(`Found configuration ${JSON.stringify(config)}`);

// Reset and migrate destination database
// resetAndMigrateDatabase(configuration.destination.connectionString);

const sourcePrisma = new PrismaClient(prismaConfig(config.source.connectionString));
const destinationPrisma = new PrismaClient(prismaConfig(config.destination.connectionString));

// Export data from source to destination database
const exportToViewService = new ExportToViewService(sourcePrisma, destinationPrisma, config);
exportToViewService
  .exportToView()
  .then(() => log('Export to view completed'))
  .catch((error) => console.error(error));
