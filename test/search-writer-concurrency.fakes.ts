import { Asset, AssetFileId } from '@asset-sg/shared/v2';

import { SearchWriterService } from '../apps/server-asset-sg/src/features/assets/search/search-writer.service';

/**
 * Test doubles for exercising the per-asset index-synchronization concurrency of {@link SearchWriterService}.
 *
 * These helpers are jest-free (they stub methods by direct assignment rather than `jest.spyOn`) and live
 * under the repository's `test/` directory, which is outside every application `src` directory and is
 * therefore excluded from the production build (see `apps/server-asset-sg/tsconfig.app.json`).
 */

/** A minimal file description used by the in-memory index model. */
export interface FileDef {
  id: number;
  pages: number[];
}

/** A promise whose settlement is controlled externally, used to coordinate deterministic test timing. */
export class Deferred<T = void> {
  readonly promise: Promise<T>;
  resolve!: (value: T) => void;
  reject!: (reason: unknown) => void;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

const microtaskGap = () => Promise.resolve();

/**
 * In-memory model of the Elasticsearch file index that reproduces the concurrency semantics responsible
 * for the reported `version_conflict_engine_exception`.
 *
 * A `deleteByQuery` first snapshots the matching documents (with their sequence numbers), then deletes
 * each one with optimistic concurrency. With the default `conflicts=abort` behaviour, if a concurrent
 * operation deletes or overwrites a snapshotted document in the meantime, the delete fails with a version
 * conflict. This model mirrors that with a synchronous snapshot phase, an asynchronous gap during which
 * other operations may interleave, and a final apply phase that verifies sequence numbers.
 *
 * It also records whether two operations for the *same* asset ever overlap, which is exactly what the
 * per-asset mutex must prevent.
 */
export class FakeFileIndex {
  private seq = 0;
  private readonly docs = new Map<string, { seqNo: number; assetId: number }>();
  private readonly busyAssets = new Set<number>();
  public conflictsThrown = 0;
  public sameAssetOverlaps = 0;

  private enter(assetId: number): void {
    if (this.busyAssets.has(assetId)) {
      this.sameAssetOverlaps++;
    }
    this.busyAssets.add(assetId);
  }

  private exit(assetId: number): void {
    this.busyAssets.delete(assetId);
  }

  seed(assetId: number, files: FileDef[]): void {
    for (const file of files) {
      for (const page of file.pages) {
        this.docs.set(`${file.id}_${page}`, { seqNo: ++this.seq, assetId });
      }
    }
  }

  private put(docId: string, assetId: number): void {
    this.docs.set(docId, { seqNo: ++this.seq, assetId });
  }

  private throwConflict(failures: Array<{ id: string; cause: { type: string } }>): never {
    this.conflictsThrown++;
    const error = new Error(
      JSON.stringify({ took: 1, timed_out: false, version_conflicts: failures.length, failures }),
    ) as Error & { statusCode?: number };
    error.statusCode = 409;
    throw error;
  }

  private applySnapshotDelete(snapshot: ReadonlyArray<readonly [string, number]>): void {
    const failures: Array<{ id: string; cause: { type: string } }> = [];
    for (const [docId, seqNo] of snapshot) {
      const current = this.docs.get(docId);
      if (current === undefined || current.seqNo !== seqNo) {
        failures.push({ id: docId, cause: { type: 'version_conflict_engine_exception' } });
      } else {
        this.docs.delete(docId);
      }
    }
    if (failures.length > 0) {
      this.throwConflict(failures);
    }
  }

  /** Models `FileSearchWriterService.writeAssetFiles`: delete all of an asset's docs, then reindex. */
  async writeAssetFiles(assetId: number, files: FileDef[]): Promise<void> {
    this.enter(assetId);
    try {
      const snapshot = [...this.docs.entries()]
        .filter(([, meta]) => meta.assetId === assetId)
        .map(([id, meta]) => [id, meta.seqNo] as const);
      await microtaskGap();
      this.applySnapshotDelete(snapshot);
      for (const file of files) {
        for (const page of file.pages) {
          this.put(`${file.id}_${page}`, assetId);
        }
      }
    } finally {
      this.exit(assetId);
    }
  }

  /** Models `FileSearchWriterService.write(fileId)`: delete a single file's docs, then reindex it. */
  async writeFile(fileId: number, assetId: number, pages: number[]): Promise<void> {
    this.enter(assetId);
    try {
      const prefix = `${fileId}_`;
      const snapshot = [...this.docs.entries()]
        .filter(([id]) => id.startsWith(prefix))
        .map(([id, meta]) => [id, meta.seqNo] as const);
      await microtaskGap();
      this.applySnapshotDelete(snapshot);
      for (const page of pages) {
        this.put(`${fileId}_${page}`, assetId);
      }
    } finally {
      this.exit(assetId);
    }
  }

  /** Models the file-index part of `deleteFromIndex`: remove every document of an asset. */
  async removeAsset(assetId: number): Promise<void> {
    this.enter(assetId);
    try {
      await microtaskGap();
      for (const [id, meta] of [...this.docs.entries()]) {
        if (meta.assetId === assetId) {
          this.docs.delete(id);
        }
      }
    } finally {
      this.exit(assetId);
    }
  }

  docIdsForAsset(assetId: number): string[] {
    return [...this.docs.entries()]
      .filter(([, meta]) => meta.assetId === assetId)
      .map(([id]) => id)
      .sort();
  }
}

/** A stale `Asset` argument as passed by callers; `register` must ignore its state and reload from the DB. */
export const staleAsset = (id: number): Asset => ({ id, files: [] }) as unknown as Asset;

/** Computes the sorted `<fileId>_<page>` document ids for a set of files. */
export const docIds = (files: FileDef[]): string[] =>
  files.flatMap((file) => file.pages.map((page) => `${file.id}_${page}`)).sort();

/** Hooks the test can install to gate operations at deterministic points. */
export interface IndexHooks {
  /** Invoked at the start of every `writeAssetFiles`, before the operation touches the index. */
  beforeWriteAssetFiles?: (assetId: number) => Promise<void> | void;
}

export interface Harness {
  service: SearchWriterService;
  index: FakeFileIndex;
  /** Mutable "database" state, keyed by asset id. Mutating it models the DB changing over time. */
  db: Map<number, FileDef[]>;
  hooks: IndexHooks;
}

export const makeHarness = (fileToAsset: Map<number, number> = new Map()): Harness => {
  const index = new FakeFileIndex();
  const db = new Map<number, FileDef[]>();
  const hooks: IndexHooks = {};

  const prisma = {
    file: {
      findUnique: async ({ where: { id } }: { where: { id: AssetFileId } }) => {
        const assetId = fileToAsset.get(id);
        return assetId == null ? null : { assetId };
      },
    },
  };
  const assetRepo = {
    // Returns the *current* database state, carrying the current file list on the asset object.
    find: async (id: number) => (db.has(id) ? ({ id, files: db.get(id) ?? [] } as unknown as Asset) : null),
  };
  const elastic = {
    delete: async () => undefined,
    deleteByQuery: async ({ query }: { query: { term: { assetId: number } } }) => index.removeAsset(query.term.assetId),
  };

  const service = new SearchWriterService(
    elastic as never,
    prisma as never,
    assetRepo as never,
    {} as never,
    {} as never,
  );
  // Stub the writer factories by direct assignment so the helper stays jest-free.
  service.getAssetWriter = (() => ({ write: async () => undefined })) as never;
  service.getFileWriter = (() => ({
    // Indexes the reloaded asset's files, proving `register` uses the reloaded object, not its argument.
    writeAssetFiles: async (a: Asset) => {
      await hooks.beforeWriteAssetFiles?.(a.id);
      return index.writeAssetFiles(a.id, (a.files as unknown as FileDef[]) ?? []);
    },
    write: async (fileId: AssetFileId) => {
      const assetId = fileToAsset.get(fileId) ?? -1;
      const file = (db.get(assetId) ?? []).find((f) => f.id === fileId);
      await index.writeFile(fileId, assetId, file?.pages ?? []);
    },
  })) as never;

  return { service, index, db, hooks };
};
