import { execSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

const ROOT = path.resolve(__dirname, '../../../..');
const PRISMA_DIR = path.join(ROOT, 'libs/persistence/prisma');
const MIGRATIONS_DIR = path.join(PRISMA_DIR, 'migrations');
const MIGRATION_NAME = '20261105120000_move_format_to_file';
const SCRATCH_DATABASE = 'postgres_test_migration_file_format';
const LEGAL_DOC_CODE = 'migrationTestLegal';

const ENV_TEST_FILE = path.join(ROOT, '.env.test');
const EXPECTED_HOST = 'localhost';
const EXPECTED_PORT = '5432';
const EXPECTED_DATABASE = 'postgres_test';

// Only the URL from `.env.test` is trusted, as this spec drops and recreates a database on the server it points to.
const readTestDatabaseUrl = (): string => {
  let content: string;
  try {
    content = readFileSync(ENV_TEST_FILE, 'utf8');
  } catch (e) {
    throw new Error(`Refusing to run: cannot read ${ENV_TEST_FILE}: ${(e as Error).message}`);
  }
  const value = dotenv.parse(content).DATABASE_URL;
  if (value == null || value.trim() === '') {
    throw new Error(`Refusing to run: DATABASE_URL is missing in ${ENV_TEST_FILE}.`);
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Refusing to run: DATABASE_URL in ${ENV_TEST_FILE} is malformed.`);
  }
  const isExpected =
    (url.protocol === 'postgresql:' || url.protocol === 'postgres:') &&
    url.hostname === EXPECTED_HOST &&
    url.port === EXPECTED_PORT &&
    url.pathname === `/${EXPECTED_DATABASE}` &&
    (url.search == '' || url.search === '?schema=public');
  if (!isExpected) {
    throw new Error(
      `Refusing to run: DATABASE_URL in ${ENV_TEST_FILE} must point to ${EXPECTED_HOST}:${EXPECTED_PORT}/${EXPECTED_DATABASE}.`,
    );
  }
  return value;
};

const withDatabase = (url: string, database: string): string => {
  const result = new URL(url);
  result.pathname = `/${database}`;
  return result.toString();
};

// Later migrations are excluded too, as they may depend on the schema the seed below writes to.
const isMigrationBeforeTarget = (source: string): boolean =>
  path.dirname(source) !== MIGRATIONS_DIR || !statSync(source).isDirectory() || path.basename(source) < MIGRATION_NAME;

interface SeedFile {
  name: string;
  legal?: boolean;
}

/**
 * Applies every migration preceding `MIGRATION_NAME` to a scratch database, seeds assets with an asset-level format
 * and attached files, then applies `MIGRATION_NAME` and checks the format assigned to each file.
 */
describe(`migration ${MIGRATION_NAME}`, () => {
  let scratchUrl: string;
  let admin: PrismaClient;
  let prisma: PrismaClient;
  let tmpDir: string;
  let workgroupId: number;
  let fileCounter = 0;
  const assetIds = new Map<string, number>();

  const prismaCli = (args: string) =>
    execSync(`npx prisma ${args}`, { cwd: ROOT, env: { ...process.env, DATABASE_URL: scratchUrl }, stdio: 'pipe' });

  const seedAsset = async (key: string, formatCode: string, files: SeedFile[]): Promise<void> => {
    const [{ asset_id: assetId }] = await prisma.$queryRawUnsafe<Array<{ asset_id: number }>>(
      `INSERT INTO asset (title_public, is_nat_rel, asset_format_item_code, create_date, is_extract, workgroup_id)
       VALUES ($1, false, $2, now(), false, $3)
       RETURNING asset_id`,
      key,
      formatCode,
      workgroupId,
    );
    assetIds.set(key, assetId);
    for (const file of files) {
      fileCounter += 1;
      // Stored names are unique and keep the original extension, which is what the migration evaluates.
      const storedName = `${fileCounter}-${file.name}`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO file (file_name, file_name_alias, size, last_modified_at, type, legal_doc_item_code, asset_id)
         VALUES ($1, $2, 1, now(), $3::"FileType", $4, $5)`,
        storedName,
        file.name,
        file.legal ? 'legal' : 'normal',
        file.legal ? LEGAL_DOC_CODE : null,
        assetId,
      );
    }
  };

  const formatsOf = async (key: string): Promise<Record<string, string>> => {
    const rows = await prisma.$queryRawUnsafe<Array<{ file_name_alias: string; asset_format_item_code: string }>>(
      'SELECT file_name_alias, asset_format_item_code FROM file WHERE asset_id = $1',
      assetIds.get(key),
    );
    return Object.fromEntries(rows.map((row) => [row.file_name_alias, row.asset_format_item_code]));
  };

  beforeAll(async () => {
    const baseUrl = readTestDatabaseUrl();
    scratchUrl = withDatabase(baseUrl, SCRATCH_DATABASE);
    admin = new PrismaClient({ datasourceUrl: baseUrl });
    await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${SCRATCH_DATABASE}" WITH (FORCE)`);
    await admin.$executeRawUnsafe(`CREATE DATABASE "${SCRATCH_DATABASE}"`);

    // Prisma resolves migrations relative to the schema, so we deploy from a copy that lacks the migration under test.
    tmpDir = mkdtempSync(path.join(tmpdir(), 'file-format-migration-'));
    cpSync(PRISMA_DIR, tmpDir, { recursive: true, filter: isMigrationBeforeTarget });
    const schemaFile = path.join(tmpDir, 'schema.prisma');
    prismaCli(`migrate deploy --schema "${schemaFile}"`);

    prisma = new PrismaClient({ datasourceUrl: scratchUrl });
    await prisma.$executeRawUnsafe(
      `INSERT INTO legal_doc_item (legal_doc_item_code, geol_code, name, name_de, name_fr, name_it, name_en,
                                   description, description_de, description_fr, description_it, description_en)
       VALUES ($1, '', 'Legal', '', '', '', '', '', '', '', '', '')
       ON CONFLICT DO NOTHING`,
      LEGAL_DOC_CODE,
    );
    [{ id: workgroupId }] = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
      `INSERT INTO workgroup (name, created_at) VALUES ('Migration', now()) RETURNING id`,
    );

    await seedAsset('other', 'other', [{ name: 'report.pdf' }, { name: 'data.csv' }]);
    await seedAsset('match', 'pdf', [{ name: 'map.png' }, { name: 'report.pdf' }, { name: 'notes.txt' }]);
    await seedAsset('exception', 'textAnalog', [
      { name: 'scan.pdf' },
      { name: 'photo.jpg' },
      { name: 'consent.pdf', legal: true },
    ]);
    await seedAsset('mixed', 'graphicRaster', [
      { name: 'IMAGE.TIFF' },
      { name: 'Layer.Shp' },
      { name: 'README' },
      { name: 'archive.tar.gz' },
      { name: 'trailing.' },
      { name: 'Movie.MP4' },
    ]);
    await seedAsset('legal-only', 'textAnalog', [{ name: 'contract.docx', legal: true }]);
    await seedAsset('legal-match', 'pdf', [{ name: 'data.csv' }, { name: 'consent.pdf', legal: true }]);
    await seedAsset('no-files', 'pdf', []);

    const migrationFile = path.join(MIGRATIONS_DIR, MIGRATION_NAME, 'migration.sql');
    prismaCli(`db execute --file "${migrationFile}" --schema "${schemaFile}"`);
  }, 180_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    await admin?.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${SCRATCH_DATABASE}" WITH (FORCE)`);
    await admin?.$disconnect();
    if (tmpDir) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('assigns extension-based formats when the asset format is "other"', async () => {
    expect(await formatsOf('other')).toEqual({ 'report.pdf': 'pdf', 'data.csv': 'db' });
  });

  it('assigns extension-based formats when one of several non-legal files matches the asset format', async () => {
    expect(await formatsOf('match')).toEqual({
      'map.png': 'graphicRaster',
      'report.pdf': 'pdf',
      'notes.txt': 'textDigital',
    });
  });

  it('keeps an unmatched asset format on non-legal files, but not on legal files', async () => {
    expect(await formatsOf('exception')).toEqual({
      'scan.pdf': 'textAnalog',
      'photo.jpg': 'textAnalog',
      'consent.pdf': 'pdf',
    });
  });

  it('evaluates the last extension case-insensitively and falls back to "other"', async () => {
    expect(await formatsOf('mixed')).toEqual({
      'IMAGE.TIFF': 'graphicRaster',
      'Layer.Shp': 'GISFormat',
      README: 'other',
      'archive.tar.gz': 'other',
      'trailing.': 'other',
      'Movie.MP4': 'multimedia',
    });
  });

  it('assigns extension-based formats to the files of an asset with only legal files', async () => {
    expect(await formatsOf('legal-only')).toEqual({ 'contract.docx': 'textDigital' });
  });

  it('ignores legal files when checking whether a file matches the asset format', async () => {
    expect(await formatsOf('legal-match')).toEqual({ 'data.csv': 'pdf', 'consent.pdf': 'pdf' });
  });

  it('keeps assets without files', async () => {
    const rows = await prisma.$queryRawUnsafe<unknown[]>(
      'SELECT 1 FROM asset WHERE asset_id = $1',
      assetIds.get('no-files'),
    );
    expect(rows).toHaveLength(1);
    expect(await formatsOf('no-files')).toEqual({});
  });

  it('removes the format column from the asset table', async () => {
    const rows = await prisma.$queryRawUnsafe<unknown[]>(
      `SELECT 1 FROM information_schema.columns
       WHERE table_name = 'asset' AND column_name = 'asset_format_item_code'`,
    );
    expect(rows).toHaveLength(0);
  });

  it('requires a format on every file', async () => {
    const [{ is_nullable: isNullable }] = await prisma.$queryRawUnsafe<Array<{ is_nullable: string }>>(
      `SELECT is_nullable FROM information_schema.columns
       WHERE table_name = 'file' AND column_name = 'asset_format_item_code'`,
    );
    expect(isNullable).toBe('NO');
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO file (file_name, size, last_modified_at, asset_id) VALUES ('missing-format.pdf', 1, now(), $1)`,
        assetIds.get('no-files'),
      ),
    ).rejects.toThrow();
  });

  it('rejects file formats that are not part of the vocabulary', async () => {
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO file (file_name, size, last_modified_at, asset_id, asset_format_item_code)
         VALUES ('unknown-format.pdf', 1, now(), $1, 'does-not-exist')`,
        assetIds.get('no-files'),
      ),
    ).rejects.toThrow();
  });

  it('prevents deleting a format that is still used by a file', async () => {
    await expect(
      prisma.$executeRawUnsafe(`DELETE FROM asset_format_item WHERE asset_format_item_code = 'pdf'`),
    ).rejects.toThrow();
  });
});
