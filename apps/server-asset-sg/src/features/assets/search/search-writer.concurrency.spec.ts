import { AssetFileId } from '@asset-sg/shared/v2';

// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  Deferred,
  docIds,
  FakeFileIndex,
  FileDef,
  makeHarness,
  staleAsset,
} from '../../../../../../test/search-writer-concurrency.fakes';
import { SearchWriterService } from '@/features/assets/search/search-writer.service';

/**
 * Fails fast (instead of relying on Jest's global timeout) if a promise that must settle for the test to
 * be meaningful never does. Used only as a watchdog on the success path; it makes no timing assumptions
 * about ordering. The timer is cleared once the watched promise settles so it never lingers.
 */
const withWatchdog = <T>(promise: Promise<T>, message: string, ms = 1000): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  const watchdog = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, watchdog]).finally(() => clearTimeout(timer));
};

describe('SearchWriterService index-sync concurrency', () => {
  it('reproduces the version conflict when asset-wide sync runs concurrently without serialization', async () => {
    // Baseline: proves the fake models the real race. Two overlapping asset-wide reindex operations for
    // the same asset must produce a version conflict, exactly like the reported bug.
    const index = new FakeFileIndex();
    const files: FileDef[] = [
      { id: 1, pages: [1, 2] },
      { id: 2, pages: [1] },
    ];
    index.seed(15523, files);

    const results = await Promise.allSettled([
      index.writeAssetFiles(15523, files),
      index.writeAssetFiles(15523, files),
    ]);

    const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    expect(rejected.length).toBeGreaterThan(0);
    expect((rejected[0].reason as { statusCode?: number }).statusCode).toBe(409);
    expect(index.sameAssetOverlaps).toBeGreaterThan(0);
  });

  it('uploads a single file to an asset with no existing files', async () => {
    const { service, index, db } = makeHarness();
    db.set(100, [{ id: 9, pages: [1, 2, 3] }]);

    await expect(service.register(staleAsset(100))).resolves.toBeUndefined();

    expect(index.docIdsForAsset(100)).toEqual(['9_1', '9_2', '9_3']);
    expect(index.conflictsThrown).toBe(0);
    expect(index.sameAssetOverlaps).toBe(0);
  });

  it('uploads multiple files concurrently to an asset that already contains indexed files (no 409, no overlap)', async () => {
    // Covers the frontend behaviour (concurrent `register` for one asset) against an asset that already
    // has indexed files. Every existing and newly indexed file must be present and no operation may overlap.
    const { service, index, db } = makeHarness();
    index.seed(15523, [{ id: 1, pages: [1, 2] }]); // pre-existing, already-indexed file
    const files: FileDef[] = [
      { id: 1, pages: [1, 2] },
      { id: 2, pages: [1] },
      { id: 3, pages: [1, 2] },
    ];
    db.set(15523, files);

    const results = await Promise.allSettled([
      service.register(staleAsset(15523)),
      service.register(staleAsset(15523)),
      service.register(staleAsset(15523)),
    ]);

    expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
    expect(index.conflictsThrown).toBe(0);
    expect(index.sameAssetOverlaps).toBe(0);
    expect(index.docIdsForAsset(15523)).toEqual(docIds(files));
  });

  it('reloads current database state after waiting for the mutex (fresh state, not the stale argument)', async () => {
    const { service, index, db, hooks } = makeHarness();
    db.set(15523, [{ id: 1, pages: [1, 2] }]);

    // Gate the first registration deterministically: signal once it has acquired the lock and entered its
    // indexing operation, then block it until the test releases it. This removes any timing assumption
    // about when the first task actually starts.
    const firstEntered = new Deferred();
    const releaseFirst = new Deferred();
    let calls = 0;
    hooks.beforeWriteAssetFiles = async () => {
      calls += 1;
      if (calls === 1) {
        firstEntered.resolve();
        await releaseFirst.promise;
      }
    };

    const first = service.register(staleAsset(15523));

    // Only proceed once the first registration provably holds the lock and is inside its operation.
    await withWatchdog(firstEntered.promise, 'first registration never acquired the lock');

    // The database changes while the first registration still holds the lock.
    const updated: FileDef[] = [
      { id: 1, pages: [1, 2] },
      { id: 2, pages: [1] },
    ];
    db.set(15523, updated);

    // Start the second registration while the first is still blocked. It must queue behind the mutex.
    const second = service.register(staleAsset(15523));

    // Release the first operation; the second can now acquire the lock.
    releaseFirst.resolve();
    await Promise.all([first, second]);

    expect(index.conflictsThrown).toBe(0);
    expect(index.sameAssetOverlaps).toBe(0);
    // The queued registration reloaded the current file list after waiting, so the newly added file is
    // present. If it had indexed the stale argument (empty) or a snapshot from before it waited, the
    // second file would be missing.
    expect(index.docIdsForAsset(15523)).toEqual(docIds(updated));
  });

  it('serializes OCR-time single-file indexing with asset-wide sync for the same asset', async () => {
    const fileToAsset = new Map<number, number>([
      [1, 15523],
      [2, 15523],
    ]);
    const { service, index, db } = makeHarness(fileToAsset);
    index.seed(15523, [{ id: 1, pages: [1, 2] }]);
    const files: FileDef[] = [
      { id: 1, pages: [1, 2] },
      { id: 2, pages: [1] },
    ];
    db.set(15523, files);

    const results = await Promise.allSettled([
      service.register(staleAsset(15523)),
      service.writeFile(2 as AssetFileId),
    ]);

    expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
    expect(index.conflictsThrown).toBe(0);
    expect(index.sameAssetOverlaps).toBe(0);
    expect(index.docIdsForAsset(15523)).toEqual(docIds(files));
  });

  it('serializes deleteFromIndex after registration for the same asset (FIFO)', async () => {
    const { service, index, db } = makeHarness();
    const files: FileDef[] = [
      { id: 1, pages: [1, 2] },
      { id: 2, pages: [1] },
    ];
    index.seed(15523, files);
    db.set(15523, files);

    // KeyedMutex is FIFO for a key: `register` is scheduled first, so it runs to completion before
    // `deleteFromIndex`. The deletion therefore observes the freshly indexed documents and removes them.
    const results = await Promise.allSettled([service.register(staleAsset(15523)), service.deleteFromIndex(15523)]);

    expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
    expect(index.conflictsThrown).toBe(0);
    expect(index.sameAssetOverlaps).toBe(0);
    // Deletion ran strictly after registration, so the final index is empty.
    expect(index.docIdsForAsset(15523)).toEqual([]);
  });

  it('indexes different assets concurrently (fails if the mutex became global)', async () => {
    const { service, index, db, hooks } = makeHarness();
    db.set(1, [{ id: 10, pages: [1] }]);
    db.set(2, [{ id: 20, pages: [1] }]);

    // Both registrations must be simultaneously inside their indexing operation. A single global mutex
    // would let only one enter, `bothEntered` would never resolve, and the watchdog would fail the test.
    const bothEntered = new Deferred();
    const release = new Deferred();
    let active = 0;
    hooks.beforeWriteAssetFiles = async () => {
      active += 1;
      if (active === 2) {
        bothEntered.resolve();
      }
      await release.promise;
    };

    const first = service.register(staleAsset(1));
    const second = service.register(staleAsset(2));

    await withWatchdog(bothEntered.promise, 'operations for different assets did not run concurrently');
    expect(active).toBe(2);

    release.resolve();
    await Promise.all([first, second]);

    expect(index.conflictsThrown).toBe(0);
    expect(index.docIdsForAsset(1)).toEqual(['10_1']);
    expect(index.docIdsForAsset(2)).toEqual(['20_1']);
  });

  describe('runExclusively', () => {
    const flushMacrotasks = () => new Promise((resolve) => setImmediate(resolve));

    it('waits for an in-progress register', async () => {
      const { service, db, hooks } = makeHarness();
      db.set(1, [{ id: 10, pages: [1] }]);

      const registerEntered = new Deferred();
      const releaseRegister = new Deferred();
      const order: string[] = [];
      hooks.beforeWriteAssetFiles = async () => {
        registerEntered.resolve();
        await releaseRegister.promise;
        order.push('register');
      };

      const registration = service.register(staleAsset(1));
      await withWatchdog(registerEntered.promise, 'registration never acquired the lock');

      const exclusive = service.runExclusively(async () => {
        order.push('exclusive');
      });
      await flushMacrotasks();
      expect(order).toEqual([]);

      releaseRegister.resolve();
      await Promise.all([registration, exclusive]);
      expect(order).toEqual(['register', 'exclusive']);
    });

    it('defers register, writeFile and deleteFromIndex started during an exclusive task until it finishes', async () => {
      const fileToAsset = new Map<number, number>([[10, 1]]);
      const { service, index, db } = makeHarness(fileToAsset);
      db.set(1, [{ id: 10, pages: [1] }]);
      db.set(2, [{ id: 20, pages: [1, 2] }]);
      index.seed(3, [{ id: 30, pages: [1] }]);

      const exclusiveEntered = new Deferred();
      const releaseExclusive = new Deferred();
      const exclusive = service.runExclusively(async () => {
        exclusiveEntered.resolve();
        await releaseExclusive.promise;
      });
      await withWatchdog(exclusiveEntered.promise, 'exclusive task never started');

      const operations = [
        service.register(staleAsset(2)),
        service.writeFile(10 as AssetFileId),
        service.deleteFromIndex(3),
      ];
      await flushMacrotasks();

      // None of the operations may have touched the index while the exclusive task is running.
      expect(index.docIdsForAsset(1)).toEqual([]);
      expect(index.docIdsForAsset(2)).toEqual([]);
      expect(index.docIdsForAsset(3)).toEqual(['30_1']);

      releaseExclusive.resolve();
      await withWatchdog(Promise.all([exclusive, ...operations]), 'queued operations never ran');

      expect(index.docIdsForAsset(1)).toEqual(['10_1']);
      expect(index.docIdsForAsset(2)).toEqual(['20_1', '20_2']);
      expect(index.docIdsForAsset(3)).toEqual([]);
      expect(index.conflictsThrown).toBe(0);
      expect(index.sameAssetOverlaps).toBe(0);
    });

    it('releases queued operations when the exclusive task fails', async () => {
      const { service, index, db } = makeHarness();
      db.set(1, [{ id: 10, pages: [1] }]);

      const releaseExclusive = new Deferred();
      const exclusive = service.runExclusively(async () => {
        await releaseExclusive.promise;
        throw new Error('sync failed');
      });
      const registration = service.register(staleAsset(1));

      releaseExclusive.resolve();
      await expect(exclusive).rejects.toThrow('sync failed');
      await expect(
        withWatchdog(registration, 'registration blocked by failed exclusive task'),
      ).resolves.toBeUndefined();
      expect(index.docIdsForAsset(1)).toEqual(['10_1']);
    });
  });
});

describe('SearchWriterService.syncWithDatabase locking', () => {
  it('runs the entire rebuild within a single exclusive scope', async () => {
    let inScope = false;
    let scopes = 0;
    const calls: Array<{ name: string; inScope: boolean }> = [];
    const record =
      <T>(name: string, value?: T) =>
      async (): Promise<T | undefined> => {
        calls.push({ name, inScope });
        return value;
      };

    let listCalls = 0;
    const elastic = {
      indices: {
        exists: record('indices.exists', false),
        create: record('indices.create'),
        putMapping: record('indices.putMapping'),
        delete: record('indices.delete'),
        refresh: record('indices.refresh'),
      },
    };
    const prisma = { asset: { count: record('asset.count', 1) } };
    const assetRepo = {
      list: async () => {
        calls.push({ name: 'assetRepo.list', inScope });
        listCalls += 1;
        return listCalls === 1 ? [staleAsset(1)] : [];
      },
    };
    const service = new SearchWriterService(
      elastic as never,
      prisma as never,
      assetRepo as never,
      {} as never,
      {} as never,
    );
    service.getAssetWriter = (() => ({ write: record('assetWriter.write') })) as never;
    service.getFileWriter = (() => ({ writeAssetFiles: record('fileWriter.writeAssetFiles') })) as never;
    (service as unknown as { reindexAndPollForCompletion: () => Promise<void> }).reindexAndPollForCompletion = record(
      'reindex',
    ) as () => Promise<void>;

    const runExclusively = service.runExclusively.bind(service);
    service.runExclusively = <T>(task: () => Promise<T>): Promise<T> =>
      runExclusively(async () => {
        scopes += 1;
        inScope = true;
        try {
          return await task();
        } finally {
          inScope = false;
        }
      });

    await service.syncWithDatabase(() => {
      calls.push({ name: 'onProgress', inScope });
    });

    expect(scopes).toBe(1);
    const names = calls.map((it) => it.name);
    expect(names[0]).toBe('asset.count');
    expect(names).toEqual(
      expect.arrayContaining([
        'fileWriter.writeAssetFiles',
        'assetWriter.write',
        'onProgress',
        'reindex',
        'indices.delete',
      ]),
    );
    expect(names.filter((it) => it === 'reindex')).toHaveLength(2);
    expect(calls.filter((it) => !it.inScope)).toEqual([]);
  });
});
