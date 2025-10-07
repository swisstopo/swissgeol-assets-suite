import { Asset, AssetEditPolicy, AssetFile, AssetFileSchema, convert, LegalDocCode, User } from '@asset-sg/shared/v2';
import {
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';
import { authorize } from '@/core/authorize';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { AssetRepo } from '@/features/assets/asset.repo';
import { FileS3Service } from '@/features/assets/files/file-s3.service';
import { FileRepo } from '@/features/assets/files/file.repo';
import { FileService } from '@/features/assets/files/file.service';
import { parseEnumFromRequest } from '@/utils/request';

@Controller('/assets/:assetId/files')
export class FilesController {
  constructor(
    private readonly fileRepo: FileRepo,
    private readonly assetRepo: AssetRepo,
    private readonly fileS3Service: FileS3Service,
    private readonly fileService: FileService,
  ) {}

  @Get('/')
  async list(@Param('assetId', ParseIntPipe) assetId: number, @CurrentUser() user: User): Promise<AssetFileSchema[]> {
    const asset = await this.findAssetOrThrow(assetId);
    authorize(AssetEditPolicy, user).canShow(asset);

    const files = await this.fileRepo.list({ assetId });
    return convert(AssetFileSchema, files);
  }

  @Get('/:id')
  async download(
    @Param('assetId', ParseIntPipe) assetId: number,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @CurrentUser() user: User,
  ) {
    const asset = await this.assetRepo.find(assetId);
    if (asset == null || null === asset.files.find((it) => it.id === id)) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }
    authorize(AssetEditPolicy, user).canShow(asset);

    const record = await this.fileRepo.find({ assetId, id });
    if (record == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }

    const file = await this.fileS3Service.load(record.name);
    if (file == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }

    if (file.metadata.mediaType) {
      res.setHeader('Content-Type', file.metadata.mediaType);
    }
    if (file.metadata.byteCount != null) {
      res.setHeader('Content-Length', file.metadata.byteCount.toString());
    }
    res.setHeader('Content-Disposition', `filename="${record.name}"`);
    file.content.pipe(res);
  }

  @Post('/')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2000 * 1024 * 1024 } }))
  async upload(
    @Param('assetId', ParseIntPipe) assetId: number,
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ): Promise<AssetFileSchema> {
    const asset = await this.findAssetOrThrow(assetId);
    authorize(AssetEditPolicy, user).canUpdate(asset);

    const body = req.body as {
      legalDocCode?: string;
    };
    const legalDocCode = parseEnumFromRequest(LegalDocCode, body.legalDocCode, 'Invalid legalDocCode');
    const record = await this.fileService.create({
      name: file.originalname,
      size: file.size,
      legalDocCode,
      assetId: asset.id,
      user,
      content: file.buffer,
      mediaType: file.mimetype,
    });
    return plainToInstance(AssetFileSchema, record);
  }

  @Post('/:id/reanalyze')
  @HttpCode(HttpStatus.ACCEPTED)
  async reanalyze(
    @Param('assetId', ParseIntPipe) assetId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<AssetFile | null> {
    const asset = await this.findAssetOrThrow(assetId);
    authorize(AssetEditPolicy, user).canUpdate(asset);
    return await this.fileService.reanalyzeFile({ id, assetId: asset.id });
  }

  private async findAssetOrThrow(assetId: number): Promise<Asset> {
    const asset = await this.assetRepo.find(assetId);
    if (asset == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }

    return asset;
  }
}
