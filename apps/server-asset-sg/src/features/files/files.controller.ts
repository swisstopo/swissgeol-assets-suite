import { AssetEditDetail } from '@asset-sg/shared';
import {
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  ParseIntPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '@shared/models/user';
import { AssetEditPolicy } from '@shared/policies/asset-edit.policy';
import { Response } from 'express';
import * as E from 'fp-ts/Either';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { Authorized } from '@/core/decorators/authorized.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { UsePolicy } from '@/core/decorators/use-policy.decorator';
import { UseRepo } from '@/core/decorators/use-repo.decorator';
import { PrismaService } from '@/core/prisma.service';
import { AssetEditRepo } from '@/features/asset-edit/asset-edit.repo';
import { AssetEditService } from '@/features/asset-edit/asset-edit.service';
import { getFile } from '@/utils/file/get-file';

@Controller('/files')
@UseRepo(AssetEditRepo)
@UsePolicy(AssetEditPolicy)
export class FilesController {
  constructor(private readonly assetEditService: AssetEditService, private readonly prismaService: PrismaService) {}

  @Get('/:id')
  @Authorize.Show({ id: Number }, (repo: AssetEditRepo) => repo.findByFile)
  async download(@Res() res: Response, @Param('id', ParseIntPipe) id: number) {
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
  @Authorize.Update((req) => parseInt(req.body.assetId))
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 250 * 1024 * 1024 } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Authorized.Record() asset: AssetEditDetail,
    @CurrentUser() user: User
  ) {
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
  @Authorize.Delete({ id: Number }, (repo: AssetEditRepo) => repo.findByFile)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Authorized.Record() asset: AssetEditDetail,
    @CurrentUser() user: User
  ) {
    const e = await this.assetEditService.deleteFile(user, asset.assetId, id)();
    if (E.isLeft(e)) {
      throw new HttpException(e.left.message, 500);
    }
    return e.right;
  }
}
