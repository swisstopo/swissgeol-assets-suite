import { execSync } from 'child_process';

export function resetAndMigrateDatabase(connectionString: string) {
  execSync(`export DATABASE_URL=${connectionString} && npx prisma migrate reset --force`, {
    stdio: 'inherit',
  });
  execSync(`export DATABASE_URL=${connectionString} && npx prisma migrate deploy`, {
    stdio: 'inherit',
  });
}
