import { SyncConfig } from './config';
import { ExportToViewService } from './export-to-view.service';

// Suppress log output during tests
jest.mock('./log', () => ({
  log: jest.fn(),
}));

// Keep this in sync with FILE_CHUNK_SIZE in export-to-view.service.ts.
const FILE_CHUNK_SIZE = 10;

const config: SyncConfig = {
  mode: 'view',
  syncAssignee: 'test@test.com',
  source: { connectionString: 'source', allowedWorkgroupIds: [1] },
  destination: { connectionString: 'destination', allowedWorkgroupIds: [1] },
};

type PublishData = {
  authors: boolean;
  initiators: boolean;
  suppliers: boolean;
  general: boolean;
  geometries: boolean;
  legacy: boolean;
  normalFiles: boolean;
  legalFiles: boolean;
  references: boolean;
};

function publishData(overrides: Partial<PublishData> = {}): PublishData {
  return {
    authors: false,
    initiators: false,
    suppliers: false,
    general: false,
    geometries: false,
    legacy: false,
    normalFiles: false,
    legalFiles: false,
    references: false,
    ...overrides,
  };
}

interface FileRow {
  id: number;
  assetId: number;
  type: 'Normal' | 'Legal';
  size: bigint;
  fulltextContent: unknown;
  pageRangeClassifications: unknown;
  pageDimensions: unknown;
}

function file(id: number, assetId: number, type: 'Normal' | 'Legal', overrides: Partial<FileRow> = {}): FileRow {
  return {
    id,
    assetId,
    type,
    size: BigInt(1),
    fulltextContent: null,
    pageRangeClassifications: null,
    pageDimensions: null,
    ...overrides,
  };
}

/**
 * Minimal in-memory emulation of `prisma.file.findMany`. It only emulates what `exportFiles` relies on:
 *   - `where.OR` of `{ assetId: { in }, type }` branches (the publishable-type filter),
 *   - `where.id.in` (the chunked full-row fetch),
 *   - `select.id` (id-only projection),
 *   - `orderBy.id === 'asc'` (deterministic ordering).
 * Everything else is asserted directly against the recorded mock calls, not recreated here.
 */
function makeFileFindMany(db: FileRow[]) {
  return jest.fn(async (args: any) => {
    let rows = db;
    const where = args?.where ?? {};

    if (Array.isArray(where.OR)) {
      rows = rows.filter((row) =>
        where.OR.some(
          (branch: any) =>
            (branch.assetId?.in ? branch.assetId.in.includes(row.assetId) : true) &&
            (branch.type ? branch.type === row.type : true),
        ),
      );
    }

    if (where.id?.in) {
      rows = rows.filter((row) => where.id.in.includes(row.id));
    }

    if (args?.orderBy?.id === 'asc') {
      // Copy before sorting so the original fixture array is never mutated.
      rows = [...rows].sort((a, b) => a.id - b.id);
    }

    if (args?.select?.id) {
      return rows.map((row) => ({ id: row.id }));
    }
    return rows;
  });
}

function createService(db: FileRow[], configs: Map<number, { publishData: PublishData }>) {
  const fileFindMany = makeFileFindMany(db);
  const fileCreateMany = jest
    .fn()
    .mockImplementation(async ({ data }: { data: unknown[] }) => ({ count: data.length }));

  const sourcePrisma = {
    file: { findMany: fileFindMany },
  } as any;
  const destinationPrisma = {
    file: { createMany: fileCreateMany },
  } as any;

  const service = new ExportToViewService(sourcePrisma, destinationPrisma, config);

  // Populate the existing (readonly) map instance rather than replacing it, to mirror production behaviour.
  const serviceConfigs = (service as any).publicAssetConfigs as Map<number, { publishData: PublishData }>;
  for (const [id, value] of configs) {
    serviceConfigs.set(id, value);
  }

  return { service, sourcePrisma, destinationPrisma, fileFindMany, fileCreateMany };
}

function exportFiles(service: ExportToViewService, assetIds: number[], batchNumber = 1): Promise<void> {
  return (service as any).exportFiles(assetIds, batchNumber);
}

/** The id-only "which files to export" query is always the first findMany call. */
function idQueryCall(fileFindMany: jest.Mock) {
  return fileFindMany.mock.calls[0][0];
}

/** The subsequent full-row fetches select complete rows via `where.id.in`. */
function fullRowQueryCalls(fileFindMany: jest.Mock) {
  return fileFindMany.mock.calls.map((call) => call[0]).filter((args) => args?.where?.id?.in !== undefined);
}

describe('ExportToViewService.exportFiles', () => {
  it('exports only publishable file types per asset (filtered in the id query)', async () => {
    const db: FileRow[] = [
      file(10, 1, 'Normal'),
      file(11, 1, 'Legal'),
      file(20, 2, 'Normal'),
      file(21, 2, 'Legal'),
      file(30, 3, 'Normal'),
      file(31, 3, 'Legal'),
    ];
    const configs = new Map<number, { publishData: PublishData }>([
      [1, { publishData: publishData({ normalFiles: true }) }], // only Normal
      [2, { publishData: publishData({ legalFiles: true }) }], // only Legal
      [3, { publishData: publishData({ normalFiles: true, legalFiles: true }) }], // both
      // asset 4 has no config at all
    ]);

    const { service, fileFindMany, fileCreateMany } = createService(db, configs);
    await exportFiles(service, [1, 2, 3, 4]);

    // The generated id query must filter both types in the database, select ids only, and order deterministically.
    expect(idQueryCall(fileFindMany)).toEqual({
      where: {
        OR: [
          { assetId: { in: [1, 3] }, type: 'Normal' },
          { assetId: { in: [2, 3] }, type: 'Legal' },
        ],
      },
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    // ...and the resulting inserted rows match that filter (asset1 Normal, asset2 Legal, asset3 both).
    const inserted = fileCreateMany.mock.calls.flatMap((call) => call[0].data as Array<{ id: number }>);
    expect(inserted.map((f) => f.id).sort((a, b) => a - b)).toEqual([10, 21, 30, 31]);
    for (const call of fileCreateMany.mock.calls) {
      expect(call[0].skipDuplicates).toBe(true);
    }
  });

  it('runs an id-only first query that never fetches the heavy JSON columns', async () => {
    const db: FileRow[] = [file(10, 1, 'Normal')];
    const configs = new Map<number, { publishData: PublishData }>([
      [1, { publishData: publishData({ normalFiles: true }) }],
    ]);

    const { service, fileFindMany } = createService(db, configs);
    await exportFiles(service, [1]);

    expect(fileFindMany.mock.calls[0][0].select).toEqual({ id: true });
  });

  it('does not query or insert files when no asset publishes files', async () => {
    const db: FileRow[] = [file(10, 1, 'Normal')];
    const configs = new Map<number, { publishData: PublishData }>([[1, { publishData: publishData() }]]);

    const { service, sourcePrisma, fileCreateMany } = createService(db, configs);
    await exportFiles(service, [1]);

    expect(sourcePrisma.file.findMany).not.toHaveBeenCalled();
    expect(fileCreateMany).not.toHaveBeenCalled();
  });

  it('runs the id query but skips full-row fetch and insert when publication is enabled but no file matches', async () => {
    // Publication is enabled, but there is no Normal file to export.
    const db: FileRow[] = [file(11, 1, 'Legal')];
    const configs = new Map<number, { publishData: PublishData }>([
      [1, { publishData: publishData({ normalFiles: true }) }],
    ]);

    const { service, fileFindMany, fileCreateMany } = createService(db, configs);
    await exportFiles(service, [1]);

    // The id query runs...
    expect(fileFindMany).toHaveBeenCalledTimes(1);
    expect(idQueryCall(fileFindMany).select).toEqual({ id: true });
    // ...but there is no full-row fetch and no insert.
    expect(fullRowQueryCalls(fileFindMany)).toHaveLength(0);
    expect(fileCreateMany).not.toHaveBeenCalled();
  });

  it('passes through the large JSON columns of exported files unchanged (no clone/serialize)', async () => {
    const fulltext = { pages: [{ text: 'hello world' }] };
    const ranges = [{ from: 1, to: 2 }];
    const dims = [{ width: 100, height: 200 }];
    const db: FileRow[] = [
      file(10, 1, 'Normal', { fulltextContent: fulltext, pageRangeClassifications: ranges, pageDimensions: dims }),
    ];
    const configs = new Map<number, { publishData: PublishData }>([
      [1, { publishData: publishData({ normalFiles: true }) }],
    ]);

    const { service, fileCreateMany } = createService(db, configs);
    await exportFiles(service, [1]);

    const inserted = fileCreateMany.mock.calls.flatMap((call) => call[0].data as any[]);
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({ id: 10 });
    // Reference equality proves the JSON values are forwarded as-is, not cloned or re-serialized.
    expect(inserted[0].fulltextContent).toBe(fulltext);
    expect(inserted[0].pageRangeClassifications).toBe(ranges);
    expect(inserted[0].pageDimensions).toBe(dims);
  });

  it('inserts exactly one bounded chunk when there are exactly FILE_CHUNK_SIZE files', async () => {
    const db: FileRow[] = Array.from({ length: FILE_CHUNK_SIZE }, (_, i) => file(100 + i, 1, 'Normal'));
    const configs = new Map<number, { publishData: PublishData }>([
      [1, { publishData: publishData({ normalFiles: true }) }],
    ]);

    const { service, fileCreateMany } = createService(db, configs);
    await exportFiles(service, [1]);

    expect(fileCreateMany).toHaveBeenCalledTimes(1);
    expect(fileCreateMany.mock.calls[0][0].data).toHaveLength(FILE_CHUNK_SIZE);
    expect(fileCreateMany.mock.calls[0][0].skipDuplicates).toBe(true);
  });

  it('fetches and inserts in fixed-size chunks without accumulating rows across chunks', async () => {
    const total = FILE_CHUNK_SIZE * 2 + 3; // 23 -> chunks of 10, 10, 3
    const db: FileRow[] = Array.from({ length: total }, (_, i) => file(100 + i, 1, 'Normal'));
    const configs = new Map<number, { publishData: PublishData }>([
      [1, { publishData: publishData({ normalFiles: true }) }],
    ]);

    const { service, fileFindMany, fileCreateMany } = createService(db, configs);
    await exportFiles(service, [1]);

    const fullRowCalls = fullRowQueryCalls(fileFindMany);
    const insertCalls = fileCreateMany.mock.calls.map((c) => c[0]);

    // Exactly three full-row fetches and three inserts (10, 10, 3).
    expect(fullRowCalls).toHaveLength(3);
    expect(insertCalls).toHaveLength(3);

    const fetchIdChunks = fullRowCalls.map((args) => args.where.id.in as number[]);
    const insertIdChunks = insertCalls.map((args) => (args.data as Array<{ id: number }>).map((f) => f.id));

    fullRowCalls.forEach((args, index) => {
      // Full-row queries must fetch complete rows (no id-only projection) and stay ordered.
      expect(args.select).toBeUndefined();
      expect(args.orderBy).toEqual({ id: 'asc' });
      // Must not carry the original Normal/Legal OR filter.
      expect(args.where.OR).toBeUndefined();
      // Each insert is bounded and uses skipDuplicates.
      expect(insertIdChunks[index].length).toBeLessThanOrEqual(FILE_CHUNK_SIZE);
      expect(insertCalls[index].skipDuplicates).toBe(true);
      // Each insert corresponds exactly to its matching fetch chunk (no cross-chunk reuse).
      expect(insertIdChunks[index]).toEqual(fetchIdChunks[index]);
    });

    // Chunk sizes are exactly 10, 10, 3.
    expect(fetchIdChunks.map((c) => c.length)).toEqual([FILE_CHUNK_SIZE, FILE_CHUNK_SIZE, 3]);

    // No id appears in more than one fetch chunk, and every file is inserted exactly once.
    const allFetchIds = fetchIdChunks.flat();
    expect(new Set(allFetchIds).size).toBe(allFetchIds.length);
    const insertedIds = insertIdChunks.flat();
    expect(insertedIds.sort((a, b) => a - b)).toEqual(db.map((f) => f.id));
  });
});

describe('ExportToViewService.exportToView', () => {
  it('verifies the outer batch flow calls exportFiles after exportAssets', async () => {
    // Drive the outer batch loop with a single public asset while stubbing every heavy collaborator.
    const destinationPrisma = { $executeRaw: jest.fn().mockResolvedValue(0) } as any;
    const service = new ExportToViewService({} as any, destinationPrisma, config);

    const order: string[] = [];

    jest
      .spyOn(service as any, 'findPublicAssetIds')
      .mockResolvedValue([{ assetId: 1, workgroupId: 1, publishData: publishData() }]);
    jest.spyOn(service as any, 'exportItems').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'export').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'exportSiblings').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'exportAssets').mockImplementation(async () => {
      order.push('assets');
    });
    jest.spyOn(service as any, 'exportFiles').mockImplementation(async () => {
      order.push('files');
    });

    await service.exportToView();

    expect(order).toEqual(['assets', 'files']);
    expect((service as any).exportFiles).toHaveBeenCalledWith([1], 1);
  });
});
