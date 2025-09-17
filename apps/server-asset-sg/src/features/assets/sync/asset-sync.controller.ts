import { Controller, Get, HttpException, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { AssetSyncService } from '@/features/assets/sync/asset-sync.service';

@Controller('/assets/sync')
export class AssetSyncController {
  constructor(private readonly assetSyncService: AssetSyncService) {}

  @Get('/')
  @Authorize.Admin()
  async show(@Res() res: Response): Promise<{ progress: number } | void> {
    try {
      const state = await this.assetSyncService.show();
      if (state === null) {
        res.status(204).end();
        return;
      }
      res.status(200).json({ progress: state.progress }).end();
    } catch (e) {
      throw new HttpException(`${e}`, 500);
    }
  }

  @Post('/')
  @Authorize.Admin()
  async start(@Res() res: Response): Promise<void> {
    await this.assetSyncService.startSync();
    res.status(200).end();
  }
}
