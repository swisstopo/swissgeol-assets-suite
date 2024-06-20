import fs from 'fs/promises';

import { Controller, Get, HttpException, OnApplicationBootstrap, Post, Res } from '@nestjs/common';
import { Response } from 'express';

import { RequireRole } from '@/core/decorators/require-role.decorator';
import { AssetSearchService } from '@/features/assets/search/asset-search.service';
import { Role } from '@/features/users/user.model';

@Controller('/assets/sync')
export class AssetSyncController implements OnApplicationBootstrap {
  constructor(private readonly assetSearchService: AssetSearchService) {}

  async onApplicationBootstrap() {
    const syncFileExists = await fs
      .access(assetSyncFile)
      .then(() => true)
      .catch(() => false);
    if (syncFileExists) {
      void fs.rm(assetSyncFile);
    }
  }

  @Get('/')
  @RequireRole(Role.MasterEditor)
  async show(@Res() res: Response): Promise<{ progress: number } | void> {
    try {
      const data = await fs.readFile(assetSyncFile, { encoding: 'utf-8' });
      const state: AssetSyncState = JSON.parse(data);
      res.status(200).json({ progress: state.progress }).end();
    } catch (e) {
      if ((e as { code?: string }).code === 'ENOENT') {
        res.status(204).end();
        return;
      }
      throw new HttpException(`${e}`, 500);
    }
  }

  @Post('/')
  @RequireRole(Role.MasterEditor)
  async start(@Res() res: Response): Promise<void> {
    const isSyncRunning = await fs
      .access(assetSyncFile)
      .then(() => true)
      .catch(() => false);
    if (isSyncRunning) {
      res.status(204).end();
      return;
    }

    const writeProgress = (progress: number): Promise<void> => {
      const state: AssetSyncState = { progress: parseFloat(progress.toFixed(3)) };
      const data = JSON.stringify(state);
      return fs.writeFile(assetSyncFile, data, { encoding: 'utf-8' });
    };

    await writeProgress(0);
    setTimeout(async () => {
      await this.assetSearchService.syncWithDatabase(writeProgress);
      await fs.rm(assetSyncFile);
    });
    res.status(201).end();
  }
}

/**
 * The file into which the progress of the current asset sync is written.
 * This allows the sync to be shared across all users and requests without requiring a database entry.
 * Note that the file path is relative to the project root, _not_ to this file.
 */
const assetSyncFile = './asset-sync-progress.tmp.json';

interface AssetSyncState {
  progress: number;
}
