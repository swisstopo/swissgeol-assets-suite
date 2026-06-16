import {
  Controller,
  DefaultValuePipe,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  ParseBoolPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { AssetSyncService } from '@/features/assets/sync/asset-sync.service';
import { FileFulltextSyncService } from '@/features/assets/sync/file-fulltext-sync.service';

@Controller('/assets/sync')
export class AssetSyncController {
  private readonly logger = new Logger(AssetSyncController.name);

  constructor(
    private readonly assetSyncService: AssetSyncService,
    private readonly fileFulltextSyncService: FileFulltextSyncService,
  ) {}

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
      this.logger.error('Failed to show sync state', e instanceof Error ? e.stack : e);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('/')
  @Authorize.Admin()
  async start(@Res() res: Response): Promise<void> {
    await this.assetSyncService.startSync();
    res.status(200).end();
  }

  @Get('/full-text')
  @Authorize.Admin()
  async showFullTextState(@Res() res: Response): Promise<{ progress: number } | void> {
    try {
      const state = await this.fileFulltextSyncService.show();
      if (state === null) {
        res.status(204).end();
        return;
      }
      res.status(200).json({ progress: state.progress }).end();
    } catch (e) {
      this.logger.error('Failed to show full-text sync state', e instanceof Error ? e.stack : e);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('/full-text')
  @Authorize.Admin()
  async startFullText(
    @Res() res: Response,
    @Query('reloadFromS3', new DefaultValuePipe(false), new ParseBoolPipe()) reloadFromS3: boolean,
  ): Promise<void> {
    if (reloadFromS3) {
      await this.fileFulltextSyncService.reloadFromS3AndStartSync();
    } else {
      await this.fileFulltextSyncService.startSync();
    }
    res.status(200).end();
  }
}
