import { execSync } from 'node:child_process';
import path from 'node:path';
import * as dotenv from 'dotenv';

export default async function globalSetup() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.test'), override: true });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl?.includes('_test')) {
    throw new Error(
      'Refusing to run tests: DATABASE_URL does not point to a test database. ' +
        'Ensure .env.test exists at the project root and contains a DATABASE_URL with a test database (e.g. postgres_test).',
    );
  }

  try {
    execSync('npx prisma migrate deploy --schema libs/persistence/prisma/schema.prisma', {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'inherit',
    });
  } catch {
    console.error(
      '\n❌ Failed to apply migrations to the test database.\n' +
        'If the database does not exist yet, create it with:\n\n' +
        '  cd development && docker compose exec db psql -U postgres -c "CREATE DATABASE postgres_test;"\n',
    );
    process.exit(1);
  }
}
