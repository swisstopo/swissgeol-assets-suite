import { AssetService } from '@/features/assets/asset.service';

// Mock pdfjs-dist to avoid ES module import.meta issues in Jest (imported transitively via FileService).
jest.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({ getDocument: jest.fn() }));

class Deferred<T> {
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

const flushMacrotasks = () => new Promise((resolve) => setImmediate(resolve));

const makeService = (repoDelete: () => Promise<boolean>) => {
  const deleteFromIndex = jest.fn(async () => undefined);
  const assetRepo = { delete: jest.fn(repoDelete) };
  const service = new AssetService(
    assetRepo as never,
    { deleteFromIndex } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  return { service, assetRepo, deleteFromIndex };
};

describe('AssetService.delete', () => {
  it('deletes from the index only after the database row has been deleted', async () => {
    const rowDeleted = new Deferred<boolean>();
    const { service, assetRepo, deleteFromIndex } = makeService(() => rowDeleted.promise);

    const result = service.delete(1);
    await flushMacrotasks();
    expect(assetRepo.delete).toHaveBeenCalledWith(1);
    expect(deleteFromIndex).not.toHaveBeenCalled();

    rowDeleted.resolve(true);
    await expect(result).resolves.toBe(true);
    expect(deleteFromIndex).toHaveBeenCalledWith(1);
  });

  it('still deletes from the index when the database row did not exist', async () => {
    const { service, deleteFromIndex } = makeService(async () => false);

    await expect(service.delete(1)).resolves.toBe(false);
    expect(deleteFromIndex).toHaveBeenCalledWith(1);
  });

  it('does not delete from the index when deleting the database row fails', async () => {
    const { service, deleteFromIndex } = makeService(async () => {
      throw new Error('db failure');
    });

    await expect(service.delete(1)).rejects.toThrow('db failure');
    expect(deleteFromIndex).not.toHaveBeenCalled();
  });
});
