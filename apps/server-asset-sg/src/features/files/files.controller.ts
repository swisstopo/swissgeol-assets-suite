import { User } from '@asset-sg/shared/v2';
import { AssetEditPolicy } from '@asset-sg/shared/v2';
import {
  Controller,
  Delete,
  Get,
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
import { authorize } from '@/core/authorize';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { PrismaService } from '@/core/prisma.service';
import { AssetEditRepo } from '@/features/asset-edit/asset-edit.repo';
import { AssetEditService } from '@/features/asset-edit/asset-edit.service';
import { getFile } from '@/utils/file/get-file';

@Controller('/files')
export class FilesController {
  constructor(
    private readonly assetEditService: AssetEditService,
    private readonly assetEditRepo: AssetEditRepo,
    private readonly prismaService: PrismaService
  ) {}

  @Get('/:id')
  async download(@Res() res: Response, @Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    const asset = await this.assetEditRepo.findByFile(id);
    if (asset == null) {
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
  async upload(@Req() req: Request, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: User) {
    const assetId = parseInt((req.body as { assetId?: string }).assetId ?? '');
    if (isNaN(assetId)) {
      throw new HttpException('missing assetId', HttpStatus.BAD_REQUEST);
    }
    const asset = await this.assetEditRepo.find(assetId);
    if (asset == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }
    authorize(AssetEditPolicy, user).canUpdate(asset);

    const result = await this.assetEditService.uploadFile(user, asset.assetId, {
      name: file.originalname,
      buffer: file.buffer,
      size: file.size,
      mimetype: file.mimetype,
    })();
    if (E.isLeft(result)) {
      throw new HttpException(result.left.message, 500);
    }
    return result.right;
  }

  @Delete('/:id')
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    const asset = await this.assetEditRepo.findByFile(id);
    if (asset == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }
    authorize(AssetEditPolicy, user).canDelete(asset);

    const e = await this.assetEditService.deleteFile(user, asset.assetId, id)();
    if (E.isLeft(e)) {
      throw new HttpException(e.left.message, 500);
    }
    return e.right;
  }
}
