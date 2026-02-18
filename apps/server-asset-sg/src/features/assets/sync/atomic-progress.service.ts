import fs, { rm } from 'fs/promises';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export abstract class AtomicProgressService {
  /**
   * The file into which the progress of the current asset sync is written.
   * This allows the sync to be shared across all users and requests without requiring a database entry.
   * Note that the file path is relative to the project root, _not_ to this file.
   * Example: './asset-sync-progress.tmp.json'
   */
  protected abstract readonly syncFile: string;
  protected abstract readonly logger: Logger;

  public async clearSyncFileIfExists() {
    const syncFileExists = await this.isSyncRunning();
    if (syncFileExists) {
      this.logger.log('Removing leftover sync file');
      await rm(this.syncFile);
    }
  }

  public async show(): Promise<AssetSyncState | null> {
    try {
      const data = await fs.readFile(this.syncFile, { encoding: 'utf-8' });
      const state = JSON.parse(data);
      return state;
    } catch (e) {
      if ((e as { code?: string }).code === 'ENOENT') {
        return null;
      }
      throw e;
    }
  }

  public async isSyncRunning() {
    return await fs
      .access(this.syncFile)
      .then(() => true)
      .catch(() => false);
  }

  public async startSync(): Promise<void> {
    if (await this.isSyncRunning()) {
      this.logger.debug('Sync already running.');
      return;
    }

    const writeProgress = (progress: number): Promise<void> => {
      const state: AssetSyncState = { progress: parseFloat(progress.toFixed(3)) };
      const data = JSON.stringify(state);
      return fs.writeFile(this.syncFile, data, { encoding: 'utf-8' });
    };

    await writeProgress(0);
    setTimeout(async () => {
      await this.sync(writeProgress);
      await rm(this.syncFile);
    });
  }

  /**
   * The actual sync process, which should call the provided writeProgress function with the current progress (between 0 and 1) whenever it changes. The sync is considered finished when this function resolves. After that, the sync file will be removed, so the progress will no longer be available.
   * @param writeProgress
   * @protected
   */
  protected abstract sync(writeProgress: (progress: number) => Promise<void>): Promise<void>;
}

interface AssetSyncState {
  progress: number;
}
