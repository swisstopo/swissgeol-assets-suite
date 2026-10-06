import { Asset } from '@asset-sg/shared/v2';
import { FileFulltextSyncService } from '@/features/assets/sync/file-fulltext-sync.service';

// Mock pdfjs-dist to avoid ES module import.meta issues in Jest (imported transitively via FileService).
jest.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({ getDocument: jest.fn() }));

interface Call {
  name: string;
  inScope: boolean;
}

const makeService = (batches: number[][]) => {
  let inScope = false;
  let scopes = 0;
  const calls: Call[] = [];
  const record = (name: string) => calls.push({ name, inScope });

  const fileWriter = {
    clearIndex: async () => record('clearIndex'),
    writeAssetFiles: async (assets: Asset[]) => record(`writeAssetFiles:${assets.map((it) => it.id).join(',')}`),
  };
  const searchWriterService = {
    getFileWriter: () => fileWriter,
    runExclusively: async <T>(task: () => Promise<T>): Promise<T> => {
      scopes += 1;
      record('enterScope');
      inScope = true;
      try {
        return await task();
      } finally {
        inScope = false;
        record('exitScope');
      }
    },
  };
  const assetRepo = {
    count: async () => batches.flat().length,
    list: async ({ offset }: { offset: number }) => {
      let seen = 0;
      for (const batch of batches) {
        if (seen === offset) {
          return batch.map((id) => ({ id, files: [] }) as unknown as Asset);
        }
        seen += batch.length;
      }
      return [];
    },
  };
  const fileService = {
    loadAllFulltextContentFromS3: async () => record('loadAllFulltextContentFromS3'),
  };

  const service = new FileFulltextSyncService(
    searchWriterService as never,
    {} as never,
    assetRepo as never,
    fileService as never,
    {} as never,
  );
  const sync = (options?: { reloadFromS3?: boolean }) =>
    (
      service as unknown as {
        sync: (
          writeProgress: (progress: number) => Promise<void>,
          options?: { reloadFromS3?: boolean },
        ) => Promise<void>;
      }
    ).sync(async () => undefined, options);

  return { sync, calls, getScopes: () => scopes };
};

describe(FileFulltextSyncService, () => {
  it('reloads from S3 before entering the exclusive scope', async () => {
    const { sync, calls, getScopes } = makeService([[1]]);

    await sync({ reloadFromS3: true });

    expect(getScopes()).toBe(1);
    expect(calls[0]).toEqual({ name: 'loadAllFulltextContentFromS3', inScope: false });
    expect(calls.findIndex((it) => it.name === 'loadAllFulltextContentFromS3')).toBeLessThan(
      calls.findIndex((it) => it.name === 'enterScope'),
    );
  });

  it('clears and rebuilds the index within one uninterrupted exclusive scope', async () => {
    const { sync, calls, getScopes } = makeService([[1, 2], [3, 4], [5]]);

    await sync();

    // A single scope means the lock is never released and reacquired between batches.
    expect(getScopes()).toBe(1);
    expect(calls.map((it) => it.name)).toEqual([
      'enterScope',
      'clearIndex',
      'writeAssetFiles:1,2',
      'writeAssetFiles:3,4',
      'writeAssetFiles:5',
      'exitScope',
    ]);
    expect(calls.filter((it) => it.name !== 'enterScope' && it.name !== 'exitScope').every((it) => it.inScope)).toBe(
      true,
    );
  });
});
