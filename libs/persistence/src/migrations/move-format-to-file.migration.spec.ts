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
 * and attached files, then applies `MIGRATION_NAME` and checks the format and override flag assigned to each file.
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

  /** Returns the stored format and override flag of each file of an asset, keyed by original file name. */
  const formatsOf = async (key: string): Promise<Record<string, [string, boolean]>> => {
    const rows = await prisma.$queryRawUnsafe<
      Array<{ file_name_alias: string; asset_format_item_code: string; is_format_overridden: boolean }>
    >(
      'SELECT file_name_alias, asset_format_item_code, is_format_overridden FROM file WHERE asset_id = $1',
      assetIds.get(key),
    );
    return Object.fromEntries(
      rows.map((row) => [row.file_name_alias, [row.asset_format_item_code, row.is_format_overridden]]),
    );
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

    await seedAsset('other', 'other', [{ name: 'report.pdf' }, { name: 'data.csv' }, { name: 'metadata.xml' }]);
    await seedAsset('match', 'pdf', [{ name: 'map.png' }, { name: 'report.pdf' }, { name: 'notes.txt' }]);
    await seedAsset('exception', 'textAnalog', [
      { name: 'scan.pdf' },
      { name: 'scan-2.PDF' },
      { name: 'consent.pdf', legal: true },
    ]);
    await seedAsset('mixed', 'graphicRaster', [
      { name: 'IMAGE.TIFF' },
      { name: 'Layer.Shp' },
      { name: 'Metadata.XML' },
      { name: 'Survey.SGY' },
      { name: 'slides.pptx' },
      { name: 'README' },
      { name: 'archive.tar.gz' },
      { name: 'trailing.' },
      { name: 'Movie.MP4' },
    ]);
    await seedAsset('legal-only', 'textAnalog', [{ name: 'contract.docx', legal: true }]);
    await seedAsset('legal-match', 'pdf', [{ name: 'data.csv' }, { name: 'consent.pdf', legal: true }]);
    await seedAsset('xml-only', 'GISFormat', [{ name: 'layer.xml' }]);
    await seedAsset('no-files', 'pdf', []);

    // Neither asset has a file matching its format, but only the first one has files of several detected formats.
    await seedAsset('multiple-formats', 'binary', [{ name: 'data.csv' }, { name: 'table.xlsx' }]);
    await seedAsset('single-format', 'binary', [
      { name: 'old.xls' },
      { name: 'new.xlsx' },
      { name: 'consent.pdf', legal: true },
    ]);
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
  }, 60_000);

  it('assigns extension-based formats when the asset format is "other"', async () => {
    expect(await formatsOf('other')).toEqual({
      'report.pdf': ['pdf', false],
      'data.csv': ['db', false],
      'metadata.xml': ['other', false],
    });
  });

  it('assigns extension-based formats when one of several non-legal files matches the asset format', async () => {
    expect(await formatsOf('match')).toEqual({
      'map.png': ['graphicRaster', false],
      'report.pdf': ['pdf', false],
      'notes.txt': ['textDigital', false],
    });
  });

  it('keeps an unmatched asset format on non-legal files as an override, but not on legal files', async () => {
    expect(await formatsOf('exception')).toEqual({
      'scan.pdf': ['textAnalog', true],
      'scan-2.PDF': ['textAnalog', true],
      'consent.pdf': ['pdf', false],
    });
  });

  it('evaluates the last extension case-insensitively and falls back to "other"', async () => {
    expect(await formatsOf('mixed')).toEqual({
      'IMAGE.TIFF': ['graphicRaster', false],
      'Layer.Shp': ['GISFormat', false],
      'Metadata.XML': ['other', false],
      'Survey.SGY': ['segy', false],
      'slides.pptx': ['presentation', false],
      README: ['other', false],
      'archive.tar.gz': ['other', false],
      'trailing.': ['other', false],
      'Movie.MP4': ['multimedia', false],
    });
  });

  it('does not treat ".xml" files as matching a GIS asset format', async () => {
    expect(await formatsOf('xml-only')).toEqual({ 'layer.xml': ['GISFormat', true] });
  });

  it('assigns extension-based formats to the files of an asset with only legal files', async () => {
    expect(await formatsOf('legal-only')).toEqual({ 'contract.docx': ['textDigital', false] });
  });

  it('ignores legal files when checking whether a file matches the asset format', async () => {
    expect(await formatsOf('legal-match')).toEqual({ 'data.csv': ['pdf', true], 'consent.pdf': ['pdf', false] });
  });

  it('assigns extension-based formats when the non-legal files have several detected formats', async () => {
    expect(await formatsOf('multiple-formats')).toEqual({
      'data.csv': ['db', false],
      'table.xlsx': ['spreadsheet', false],
    });
  });

  it('counts detected formats by code and keeps the asset format when there is only one', async () => {
    expect(await formatsOf('single-format')).toEqual({
      'old.xls': ['binary', true],
      'new.xlsx': ['binary', true],
      'consent.pdf': ['pdf', false],
    });
  });

  it('adds the spreadsheet and presentation formats to the vocabulary', async () => {
    const rows = await prisma.$queryRawUnsafe<Array<{ asset_format_item_code: string; name_de: string }>>(
      `SELECT asset_format_item_code, name_de FROM asset_format_item
       WHERE asset_format_item_code IN ('spreadsheet', 'presentation')
       ORDER BY asset_format_item_code`,
    );
    expect(rows).toEqual([
      { asset_format_item_code: 'presentation', name_de: 'Präsentationsformat' },
      { asset_format_item_code: 'spreadsheet', name_de: 'Tabellenformat' },
    ]);
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

  it.each(['asset_format_item_code', 'is_format_overridden'])('requires %s on every file', async (column) => {
    const [{ is_nullable: isNullable, column_default: columnDefault }] = await prisma.$queryRawUnsafe<
      Array<{ is_nullable: string; column_default: string | null }>
    >(
      `SELECT is_nullable, column_default FROM information_schema.columns
       WHERE table_name = 'file' AND column_name = $1`,
      column,
    );
    expect(isNullable).toBe('NO');
    expect(columnDefault).toBeNull();
    const values = { asset_format_item_code: `'pdf'`, is_format_overridden: 'false', [column]: 'NULL' };
    // 23502 is a not-null violation; the other column always holds a valid value.
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO file (file_name, size, last_modified_at, asset_id, asset_format_item_code, is_format_overridden)
         VALUES ('missing-${column}.pdf', 1, now(), $1, ${values.asset_format_item_code}, ${values.is_format_overridden})`,
        assetIds.get('no-files'),
      ),
    ).rejects.toThrow(/Code: `23502`/);
  });

  it('rejects file formats that are not part of the vocabulary', async () => {
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO file (file_name, size, last_modified_at, asset_id, asset_format_item_code, is_format_overridden)
         VALUES ('unknown-format.pdf', 1, now(), $1, 'does-not-exist', false)`,
        assetIds.get('no-files'),
      ),
    ).rejects.toThrow(/file_asset_format_item_code_fkey/);
  });
  it('prevents deleting a format that is still used by a file', async () => {
    await expect(
      prisma.$executeRawUnsafe(`DELETE FROM asset_format_item WHERE asset_format_item_code = 'pdf'`),
    ).rejects.toThrow();
  });
});
