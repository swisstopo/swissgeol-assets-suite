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
});
