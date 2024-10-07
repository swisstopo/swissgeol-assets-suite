import { execSync } from 'child_process';

export function resetAndMigrateDatabase(connectionString: string) {
  execSync(`npx prisma migrate reset --force`, {
    env: { ...process.env, DATABASE_URL: connectionString },
    stdio: 'inherit',
  });
  execSync(`npx prisma migrate deploy`, {
    env: { ...process.env, DATABASE_URL: connectionString },
    stdio: 'inherit',
  });
}
