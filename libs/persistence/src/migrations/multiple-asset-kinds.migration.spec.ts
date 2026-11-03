import { execSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

const ROOT = path.resolve(__dirname, '../../../..');
const PRISMA_DIR = path.join(ROOT, 'libs/persistence/prisma');
const MIGRATION_NAME = '20261026120000_multiple_asset_kinds';
const SCRATCH_DATABASE = 'postgres_test_migration_asset_kinds';

dotenv.config({ path: path.join(ROOT, '.env.test'), override: true });

const withDatabase = (url: string, database: string): string => {
  const result = new URL(url);
  result.pathname = `/${database}`;
  return result.toString();
};

/**
 * Applies every migration except `MIGRATION_NAME` to a scratch database, seeds assets that each have a single
 * asset type, then applies `MIGRATION_NAME` and checks the result.
 */
describe(`migration ${MIGRATION_NAME}`, () => {
  const baseUrl = process.env.DATABASE_URL ?? '';
  const scratchUrl = baseUrl === '' ? '' : withDatabase(baseUrl, SCRATCH_DATABASE);
  let admin: PrismaClient;
  let prisma: PrismaClient;
  let tmpDir: string;
  let kindCodes: string[];
  const assetIdsByKind = new Map<string, number[]>();

  const firstAssetOfKind = (kindCode: string): number => {
    const assetId = assetIdsByKind.get(kindCode)?.[0];
    if (assetId === undefined) {
      throw new Error(`No seeded asset with type ${kindCode}`);
    }
    return assetId;
  };

  const prismaCli = (args: string) =>
    execSync(`npx prisma ${args}`, { cwd: ROOT, env: { ...process.env, DATABASE_URL: scratchUrl }, stdio: 'pipe' });

  const insertAsset = async (
    title: string,
    kindCode: string,
    formatCode: string,
    workgroupId: number,
  ): Promise<number> => {
    const rows = await prisma.$queryRawUnsafe<Array<{ asset_id: number }>>(
      `INSERT INTO asset (title_public, is_nat_rel, asset_kind_item_code, asset_format_item_code, create_date, is_extract, workgroup_id)
       VALUES ($1, false, $2, $3, now(), false, $4)
       RETURNING asset_id`,
      title,
      kindCode,
      formatCode,
      workgroupId,
    );
    return rows[0].asset_id;
  };

  beforeAll(async () => {
    if (!baseUrl.includes('_test')) {
      throw new Error('Refusing to run: DATABASE_URL does not point to a test database (see .env.test).');
    }
    admin = new PrismaClient({ datasourceUrl: baseUrl });
    await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${SCRATCH_DATABASE}" WITH (FORCE)`);
    await admin.$executeRawUnsafe(`CREATE DATABASE "${SCRATCH_DATABASE}"`);

    // Prisma resolves migrations relative to the schema, so we deploy from a copy that lacks the migration under test.
    tmpDir = mkdtempSync(path.join(tmpdir(), 'asset-kind-migration-'));
    cpSync(PRISMA_DIR, tmpDir, {
      recursive: true,
      filter: (source) => path.basename(source) !== MIGRATION_NAME,
    });
    const schemaFile = path.join(tmpDir, 'schema.prisma');
    prismaCli(`migrate deploy --schema "${schemaFile}"`);

    prisma = new PrismaClient({ datasourceUrl: scratchUrl });
    kindCodes = (
      await prisma.$queryRawUnsafe<Array<{ asset_kind_item_code: string }>>(
        'SELECT asset_kind_item_code FROM asset_kind_item ORDER BY asset_kind_item_code LIMIT 3',
      )
    ).map((it) => it.asset_kind_item_code);
    const [{ asset_format_item_code: formatCode }] = await prisma.$queryRawUnsafe<
      Array<{ asset_format_item_code: string }>
    >('SELECT asset_format_item_code FROM asset_format_item ORDER BY asset_format_item_code LIMIT 1');

    const [{ id: workgroupId }] = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
      `INSERT INTO workgroup (name, created_at) VALUES ('Migration', now()) RETURNING id`,
    );
    const kindsToSeed = [kindCodes[0], kindCodes[0], kindCodes[1], kindCodes[2], kindCodes[1]];
    for (const [index, kindCode] of kindsToSeed.entries()) {
      const assetId = await insertAsset(`Asset ${index}`, kindCode, formatCode, workgroupId);
      assetIdsByKind.set(kindCode, [...(assetIdsByKind.get(kindCode) ?? []), assetId]);
    }

    const migrationFile = path.join(PRISMA_DIR, 'migrations', MIGRATION_NAME, 'migration.sql');
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

  it('keeps the existing type of every asset as its only selection', async () => {
    expect(assetIdsByKind.size).toBe(3);
    const rows = await prisma.$queryRawUnsafe<Array<{ asset_id: number; asset_kind_item_code: string }>>(
      'SELECT asset_id, asset_kind_item_code FROM asset_kind ORDER BY asset_id',
    );
    const expected = [...assetIdsByKind.entries()]
      .flatMap(([kindCode, ids]) => ids.map((id) => ({ asset_id: id, asset_kind_item_code: kindCode })))
      .sort((a, b) => a.asset_id - b.asset_id);
    expect(rows).toEqual(expected);
  });

  it('removes the single-value column from the asset table', async () => {
    const rows = await prisma.$queryRawUnsafe<unknown[]>(
      `SELECT 1 FROM information_schema.columns
       WHERE table_name = 'asset' AND column_name = 'asset_kind_item_code'`,
    );
    expect(rows).toHaveLength(0);
  });

  it('allows several types per asset but stores each pair only once', async () => {
    const assetId = firstAssetOfKind(kindCodes[2]);
    await prisma.$executeRawUnsafe(
      `INSERT INTO asset_kind (asset_id, asset_kind_item_code) VALUES ($1, $2)`,
      assetId,
      kindCodes[0],
    );
    const count = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
      'SELECT count(*)::int AS count FROM asset_kind WHERE asset_id = $1',
      assetId,
    );
    expect(count[0].count).toBe(2);
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO asset_kind (asset_id, asset_kind_item_code) VALUES ($1, $2)`,
        assetId,
        kindCodes[0],
      ),
    ).rejects.toThrow();
  });

  it('rejects types that are not part of the vocabulary', async () => {
    const assetId = firstAssetOfKind(kindCodes[0]);
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO asset_kind (asset_id, asset_kind_item_code) VALUES ($1, 'does-not-exist')`,
        assetId,
      ),
    ).rejects.toThrow();
  });

  it('removes the types of an asset when the asset is deleted', async () => {
    const assetId = firstAssetOfKind(kindCodes[0]);
    await prisma.$executeRawUnsafe('DELETE FROM asset WHERE asset_id = $1', assetId);
    const rows = await prisma.$queryRawUnsafe<unknown[]>('SELECT 1 FROM asset_kind WHERE asset_id = $1', assetId);
    expect(rows).toHaveLength(0);
  });
});
