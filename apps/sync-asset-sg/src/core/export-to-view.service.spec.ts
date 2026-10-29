import { FILE_CHUNK_SIZE, SyncConfig } from './config';
import { ExportToViewService } from './export-to-view.service';
import { log } from './log';

// Suppress log output during tests
jest.mock('./log', () => ({
  log: jest.fn(),
}));

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
    expect((service as any).exportFiles).toHaveBeenCalledWith([1]);
  });
});

describe('ExportToViewService main asset references', () => {
  interface SourceAsset {
    assetId: number;
    assetMainId: number | null;
    references?: boolean;
    eligible?: boolean;
  }

  const withoutMain = (from: number, to: number): SourceAsset[] =>
    Array.from({ length: to - from + 1 }, (_, i) => ({ assetId: from + i, assetMainId: null }));

  const foreignKeyViolation = () =>
    Object.assign(new Error('Foreign key constraint violated: `asset_asset_main_id_fkey`'), { code: 'P2003' });

  beforeEach(() => jest.mocked(log).mockClear());

  /**
   * Runs the real export loop against an in-memory destination that, like PostgreSQL, checks the
   * non-deferrable `asset_main_id` foreign key at the end of each statement.
   */
  function setup(assets: SourceAsset[], options: { failCreateOnCall?: number } = {}) {
    let source = assets;
    const target = new Map<number, number | null>();
    const createdBatches: number[][] = [];

    const sourcePrisma = {
      asset: {
        findMany: jest.fn(async ({ where }: any) =>
          source
            .filter((asset) => where.assetId.in.includes(asset.assetId))
            .map((asset) => ({ assetId: asset.assetId, assetMainId: asset.assetMainId, assetContacts: [] })),
        ),
      },
    } as any;

    const destinationPrisma = {
      $executeRaw: jest.fn().mockResolvedValue(0),
      asset: {
        createMany: jest.fn(async ({ data }: { data: Array<{ assetId: number; assetMainId: number | null }> }) => {
          if (options.failCreateOnCall === createdBatches.length + 1) {
            throw new Error('insert failed');
          }
          const statementIds = new Set(data.map((row) => row.assetId));
          if (
            data.some(
              (row) => row.assetMainId != null && !target.has(row.assetMainId) && !statementIds.has(row.assetMainId),
            )
          ) {
            throw foreignKeyViolation();
          }
          data.forEach((row) => target.set(row.assetId, row.assetMainId ?? null));
          createdBatches.push(data.map((row) => row.assetId));
          return { count: data.length };
        }),
      },
      assetContact: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
    } as any;

    const service = new ExportToViewService(sourcePrisma, destinationPrisma);
    jest.spyOn(service as any, 'findPublicAssetIds').mockImplementation(async () =>
      source
        .filter((asset) => asset.eligible !== false)
        .map((asset) => ({
          assetId: asset.assetId,
          assetMainId: asset.assetMainId,
          workgroupId: 1,
          publishData: publishData({ references: asset.references ?? true }),
        })),
    );
    jest.spyOn(service as any, 'exportItems').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'export').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'exportFiles').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'exportWorkflows').mockResolvedValue(undefined);
    const exportSiblings = jest.spyOn(service as any, 'exportSiblings').mockResolvedValue(undefined);

    const resetDestination = (next: SourceAsset[]) => {
      source = next;
      target.clear();
      createdBatches.length = 0;
    };

    return { service, target, createdBatches, destinationPrisma, exportSiblings, resetDestination };
  }

  const loggedMessages = () => jest.mocked(log).mock.calls.map(([message]) => message);

  it('sets a main asset that is exported in a later batch', async () => {
    const { service, target } = setup([
      { assetId: 1, assetMainId: 250 },
      { assetId: 2, assetMainId: 1 },
      ...withoutMain(3, 249),
      { assetId: 250, assetMainId: null },
    ]);

    await service.exportToView();

    expect(target.size).toBe(250);
    expect(target.get(1)).toBe(250);
    expect(target.get(2)).toBe(1);
  });

  it('sets references along a chain spanning several batches', async () => {
    const { service, target } = setup([
      ...withoutMain(1, 9),
      { assetId: 10, assetMainId: 150 },
      ...withoutMain(11, 149),
      { assetId: 150, assetMainId: 260 },
      ...withoutMain(151, 259),
      { assetId: 260, assetMainId: 5 },
      ...withoutMain(261, 300),
    ]);

    await service.exportToView();

    expect(target.size).toBe(300);
    expect(target.get(10)).toBe(150);
    expect(target.get(150)).toBe(260);
    expect(target.get(260)).toBe(5);
  });

  it('clears the reference when the main asset is not eligible', async () => {
    const { service, target } = setup([
      { assetId: 1, assetMainId: 900 },
      { assetId: 900, assetMainId: null, eligible: false },
    ]);

    await service.exportToView();

    expect([...target.entries()]).toEqual([[1, null]]);
  });

  it('clears the reference when the asset does not publish references', async () => {
    const { service, target } = setup([
      { assetId: 1, assetMainId: 2, references: false },
      { assetId: 2, assetMainId: null },
    ]);

    await service.exportToView();

    expect(target.get(1)).toBeNull();
  });

  it('keeps the reference when only the main asset does not publish references', async () => {
    const { service, target } = setup([
      { assetId: 1, assetMainId: 2 },
      { assetId: 2, assetMainId: null, references: false },
    ]);

    await service.exportToView();

    expect(target.get(1)).toBe(2);
  });

  it('omits and logs a self-reference but keeps references to that asset', async () => {
    const { service, target, exportSiblings } = setup([
      { assetId: 7, assetMainId: 7 },
      { assetId: 8, assetMainId: 7 },
    ]);

    await expect(service.exportToView()).resolves.toBeUndefined();

    expect(target.get(7)).toBeNull();
    expect(target.get(8)).toBe(7);
    expect(loggedMessages()).toContain('Omitting main asset reference 7 -> 7: part of a cycle.');
    expect(exportSiblings).toHaveBeenCalled();
  });

  it('omits and logs every reference of cycles spanning batches and completes the export', async () => {
    const assets: SourceAsset[] = [
      { assetId: 1, assetMainId: 250 },
      ...withoutMain(2, 49),
      { assetId: 50, assetMainId: 150 },
      ...withoutMain(51, 149),
      { assetId: 150, assetMainId: 260 },
      ...withoutMain(151, 249),
      { assetId: 250, assetMainId: 1 },
      ...withoutMain(251, 259),
      { assetId: 260, assetMainId: 50 },
      ...withoutMain(261, 300),
    ];
    const { service, target, exportSiblings, destinationPrisma } = setup(assets);

    await expect(service.exportToView()).resolves.toBeUndefined();

    expect(target.size).toBe(300);
    expect([...target.values()].every((assetMainId) => assetMainId === null)).toBe(true);
    expect(loggedMessages()).toEqual(
      expect.arrayContaining([
        'Omitting main asset reference 1 -> 250: part of a cycle.',
        'Omitting main asset reference 250 -> 1: part of a cycle.',
        'Omitting main asset reference 50 -> 150: part of a cycle.',
        'Omitting main asset reference 150 -> 260: part of a cycle.',
        'Omitting main asset reference 260 -> 50: part of a cycle.',
      ]),
    );
    expect(exportSiblings).toHaveBeenCalled();
    expect(destinationPrisma.$executeRaw).toHaveBeenCalledTimes(2);
  });

  it('keeps references into a cycle while omitting the cycle itself', async () => {
    const { service, target } = setup([
      { assetId: 1, assetMainId: 250 },
      { assetId: 3, assetMainId: 1 },
      { assetId: 4, assetMainId: 3 },
      ...withoutMain(5, 249),
      { assetId: 250, assetMainId: 1 },
    ]);

    await service.exportToView();

    expect(target.get(1)).toBeNull();
    expect(target.get(250)).toBeNull();
    expect(target.get(3)).toBe(1);
    expect(target.get(4)).toBe(3);
    expect(loggedMessages().filter((message) => message.startsWith('Omitting'))).toHaveLength(2);
  });

  it('fails and logs the batch when inserting a later batch fails', async () => {
    const { service, target, exportSiblings } = setup(
      [{ assetId: 1, assetMainId: 250 }, ...withoutMain(2, 249), { assetId: 250, assetMainId: null }],
      { failCreateOnCall: 3 },
    );

    await expect(service.exportToView()).rejects.toThrow('insert failed');

    expect(target.size).toBe(200);
    expect(loggedMessages()).toEqual(expect.arrayContaining([expect.stringMatching(/^Failed to create assets \[\d+/)]));
    expect(exportSiblings).not.toHaveBeenCalled();
  });

  it('does not carry references or omissions over to a later run', async () => {
    const { service, target, resetDestination } = setup([
      { assetId: 1, assetMainId: 2 },
      { assetId: 2, assetMainId: 1 },
      { assetId: 3, assetMainId: 1 },
    ]);
    await service.exportToView();

    resetDestination([
      { assetId: 1, assetMainId: 2 },
      { assetId: 2, assetMainId: null },
      { assetId: 3, assetMainId: null },
    ]);
    jest.mocked(log).mockClear();
    await service.exportToView();

    expect([...target.entries()].sort(([a], [b]) => a - b)).toEqual([
      [1, 2],
      [2, null],
      [3, null],
    ]);
    expect(loggedMessages().some((message) => message.startsWith('Omitting'))).toBe(false);
  });

  it('completes an empty export without touching asset references', async () => {
    const { service, target, destinationPrisma } = setup([]);

    await expect(service.exportToView()).resolves.toBeUndefined();

    expect(target.size).toBe(0);
    expect(destinationPrisma.asset.createMany).not.toHaveBeenCalled();
  });

  it('moves main assets into the batch of their first child and otherwise keeps asset ID order', async () => {
    const { service, createdBatches } = setup([
      { assetId: 1, assetMainId: 250 },
      { assetId: 2, assetMainId: 1 },
      ...withoutMain(3, 249),
      { assetId: 250, assetMainId: null },
    ]);
    const ids = (from: number, to: number) => withoutMain(from, to).map(({ assetId }) => assetId);

    await service.exportToView();

    expect(createdBatches.map((batch) => [...batch].sort((a, b) => a - b))).toEqual([
      [...ids(1, 99), 250],
      ids(100, 199),
      ids(200, 249),
    ]);
  });

  it('selects the main asset id of public assets', async () => {
    const queryRaw = jest.fn().mockResolvedValue([]);
    const service = new ExportToViewService({ $queryRaw: queryRaw } as any, {} as any);

    await (service as any).findPublicAssetIds();

    const sql = (queryRaw.mock.calls[0][0] as string[]).join('?').replace(/\s+/g, ' ');
    expect(sql).toContain('a.asset_main_id AS "assetMainId"');
  });
});
