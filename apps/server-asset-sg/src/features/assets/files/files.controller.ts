import { AssetFile, AssetFileType, LegalDocItemCode } from '@asset-sg/shared';
import { AssetEditPolicy, User } from '@asset-sg/shared/v2';
import {
  Controller,
  Delete,
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
import { Response } from 'express';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { authorize } from '@/core/authorize';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { PrismaService } from '@/core/prisma.service';
import { AssetEditRepo } from '@/features/assets/asset-edit/asset-edit.repo';
import { FileOcrService } from '@/features/assets/files/file-ocr.service';
import { FileS3Service } from '@/features/assets/files/file-s3.service';
import { FileRepo } from '@/features/assets/files/file.repo';
import { FileService } from '@/features/assets/files/file.service';

@Controller('/assets/:assetId/files')
export class FilesController {
  constructor(
    private readonly fileRepo: FileRepo,
    private readonly fileOcrService: FileOcrService,
    private readonly fileS3Service: FileS3Service,
    private readonly assetEditRepo: AssetEditRepo,
    private readonly prismaService: PrismaService,
    private readonly fileService: FileService
  ) {}

  @Get('/:id')
  async download(
    @Param('assetId', ParseIntPipe) assetId: number,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @CurrentUser() user: User
  ) {
    const asset = await this.assetEditRepo.find(assetId);
    if (asset == null || null === asset.assetFiles.find((it) => it.id === id)) {
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
    res.setHeader('Content-Disposition', `filename="${file.metadata.name}"`);
    file.content.pipe(res);
  }

  @Post('/')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2000 * 1024 * 1024 } }))
  async upload(
    @Param('assetId', ParseIntPipe) assetId: number,
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User
  ) {
    const asset = await this.assetEditRepo.find(assetId);
    if (asset == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }
    authorize(AssetEditPolicy, user).canUpdate(asset);

    const type = pipe(
      AssetFileType.decode((req.body as { type?: string }).type ?? ''),
      E.getOrElseW(() => null)
    );
    if (type == null) {
      throw new HttpException('invalid type', HttpStatus.BAD_REQUEST);
    }

    const legalDocItemCode = pipe(
      D.nullable(LegalDocItemCode).decode((req.body as { legalDocItemCode?: string }).legalDocItemCode ?? null),
      E.getOrElseW(() => false as const)
    );
    if (legalDocItemCode === false) {
      throw new HttpException('invalid legalDocItemCode', HttpStatus.BAD_REQUEST);
    }
    switch (type) {
      case 'Legal': {
        if (legalDocItemCode == null) {
          throw new HttpException('missing legalDocItemCode for legal file', HttpStatus.BAD_REQUEST);
        }
        break;
      }
      case 'Normal':
        if (legalDocItemCode != null) {
          throw new HttpException('legalDocItemCode is not supported for normal files', HttpStatus.BAD_REQUEST);
        }
        break;
    }

    const record = await this.fileService.create({
      name: file.originalname,
      type: type,
      size: file.size,
      legalDocItemCode,
      assetId: asset.assetId,
      user,
      content: file.buffer,
      mediaType: file.mimetype,
    });

    return AssetFile.encode(record);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('assetId', ParseIntPipe) assetId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User
  ) {
    const asset = await this.assetEditRepo.find(assetId);
    if (asset == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }
    authorize(AssetEditPolicy, user).canDelete(asset);

    await this.fileService.delete({ id, assetId: asset.assetId }, user);
  }
}
