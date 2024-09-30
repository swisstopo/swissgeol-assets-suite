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
import { AssetEditRepo } from '@/features/asset-edit/asset-edit.repo';
import { FileRepo } from '@/features/files/file.repo';
import { getFile } from '@/utils/file/get-file';

@Controller('/assets/:assetId/files')
export class FilesController {
  constructor(
    private readonly fileRepo: FileRepo,
    private readonly assetEditRepo: AssetEditRepo,
    private readonly prismaService: PrismaService
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

    const result = await getFile(this.prismaService, id)();
    if (E.isLeft(result)) {
      throw new HttpException(result.left.message, 500);
    }
    const file = result.right;
    if (file.contentType) {
      res.setHeader('Content-Type', file.contentType);
    }
    if (file.contentLength != null) {
      res.setHeader('Content-Length', file.contentLength.toString());
    }
    res.setHeader('Content-Disposition', `filename="${file.fileName}"`);
    file.stream.pipe(res);
  }

  @Post('/')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 250 * 1024 * 1024 } }))
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

    const record = await this.fileRepo.create({
      name: file.originalname,
      type: type,
      size: file.size,
      legalDocItemCode,
      mediaType: file.mimetype,
      content: file.buffer,
      assetId: asset.assetId,
      user,
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

    await this.fileRepo.delete({ id, assetId: asset.assetId, user });
  }
}
