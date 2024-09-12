import { ExportToViewService } from './export-to-view.service';
import { resetAndMigrateDatabase } from './reset-and-migrate-database';
import { log } from './log';

log('Starting data export to view');
// Read connection string for source and destination databases
const sourceConnectionString = process.env.SOURCE_CONNECTION_STRING;
const destinationConnectionString = process.env.DESTINATION_CONNECTION_STRING;

// Read allowed workgroup names from environment
const allowedWorkgroupIds = process.env.ALLOWED_WORKGROUP_IDS.split(',').map(Number);

// Reset and migrate destination database
// resetAndMigrateDatabase(destinationConnectionString);

// Export data from source to destination database
const exportToViewService = new ExportToViewService(
  sourceConnectionString,
  destinationConnectionString,
  allowedWorkgroupIds
);
exportToViewService
  .exportToView()
  .then(() => log('Export to view completed'))
  .catch((error) => console.error(error));
