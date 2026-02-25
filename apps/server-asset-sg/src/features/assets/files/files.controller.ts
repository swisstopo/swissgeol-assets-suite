import {
  Asset,
  AssetEditPolicy,
  AssetFile,
  AssetFileSchema,
  AssetFileSignedUrlSchema,
  AssetPolicy,
  convert,
  LegalDocCode,
  User,
} from '@asset-sg/shared/v2';
import {
  Controller,
  DefaultValuePipe,
  Get,
  Header,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
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
  private readonly logger = new Logger(FilesController.name);

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

  @Get('/:id/presigned')
  async presignedUrl(
    @Param('assetId', ParseIntPipe) assetId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Query('download', new DefaultValuePipe(false), new ParseBoolPipe()) download: boolean,
  ): Promise<AssetFileSignedUrlSchema> {
    const asset = await this.findAssetOrThrow(assetId);
    authorize(AssetPolicy, user).canShow(asset);

    const file = await this.fileRepo.find({ id, assetId: asset.id });
    if (file == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }
    const url = await this.fileS3Service.getPresignedUrl(file.name, file.alias, download);

    return plainToInstance(AssetFileSignedUrlSchema, { url });
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

    fileStream.content.on('error', (err) => {
      this.logger.warn('Error streaming file from S3', { error: err, fileName: file.name });
    });

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
      name: this.decodeFilename(file.originalname),
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

  /**
   * Decode filename from latin1 to utf8 to support special characters. This is a known issue with multer/busboy, in
   * that filenames are encoded in latin1 by default. The solution here is the proposed workaround from the library
   * maintainers.
   *
   * More info: https://github.com/mscdex/busboy/issues/20#issuecomment-1003622855
   */
  private decodeFilename(fileName: string): string {
    return Buffer.from(fileName, 'latin1').toString('utf8');
  }
}
