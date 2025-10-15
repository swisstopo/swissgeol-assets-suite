import {
  Asset,
  AssetEditPolicy,
  AssetFile,
  AssetFileSchema,
  AssetPolicy,
  convert,
  LegalDocCode,
  User,
} from '@asset-sg/shared/v2';
import {
  Controller,
  Get,
  Header,
  Headers,
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
  @Header('Accept-Ranges', 'bytes')
  async download(
    @Param('assetId', ParseIntPipe) assetId: number,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @CurrentUser() user: User,
    @Headers('Range') range: string,
  ) {
    const asset = await this.findAssetOrThrow(assetId);
    authorize(AssetPolicy, user).canShow(asset);

    const file = asset.files.find((it) => it.id === id);
    if (file == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }

    const fileStream = await this.fileS3Service.load(file.name, range);
    if (fileStream == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }

    res.setHeader('Content-Disposition', `filename="${file.name}"`);
    res.setHeader('Content-Length', fileStream.metadata.byteCount ?? 0);
    res.setHeader('Content-Type', fileStream.metadata.mediaType ?? 'application/octet-stream');

    if (range) {
      res.status(HttpStatus.PARTIAL_CONTENT);
    } else {
      res.status(HttpStatus.OK);
    }
    fileStream.content.pipe(res);
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

  @Post('/:id/stream')
  @Header('Accept-Ranges', 'bytes')
  async stream(
    @Headers('Range') range: string,
    @Param('assetId', ParseIntPipe) assetId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const asset = await this.findAssetOrThrow(assetId);
    authorize(AssetPolicy, user).canShow(asset);

    const fileStream = await this.fileS3Service.load('a44421_1835.pdf', range);
    if (fileStream == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }

    // important: Content-Length must be set manually; if it is missing, the browser will still load the full pdf
    res.setHeader('Content-Disposition', `filename="${fileStream.metadata.name}"`);
    res.setHeader('Content-Length', fileStream.metadata.byteCount ?? 0);

    if (range) {
      res.status(HttpStatus.PARTIAL_CONTENT);
    } else {
      res.status(HttpStatus.OK);
    }
    fileStream.content.pipe(res);
  }

  private async findAssetOrThrow(assetId: number): Promise<Asset> {
    const asset = await this.assetRepo.find(assetId);
    if (asset == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }

    return asset;
  }
}
