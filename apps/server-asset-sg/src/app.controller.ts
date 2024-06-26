import { decodeError, DT, unknownToError } from '@asset-sg/core';
import { AssetByTitle, isEditor, PatchAsset, PatchContact, User as AssetUser } from '@asset-sg/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Redirect,
  Req,
  UploadedFile,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';

import { RequireRole } from '@/core/decorators/require-role.decorator';
import { AssetEditRepo } from '@/features/asset-old/asset-edit.repo';
import { AssetEditDetail, AssetEditService } from '@/features/asset-old/asset-edit.service';
import { AssetSearchService } from '@/features/assets/search/asset-search.service';
import { Contact, ContactData, ContactDataBoundary, ContactId } from '@/features/contacts/contact.model';
import { ContactRepo } from '@/features/contacts/contact.repo';
import { ContactsController } from '@/features/contacts/contacts.controller';
import { Role, User, UserDataBoundary, UserId } from '@/features/users/user.model';
import { UserRepo } from '@/features/users/user.repo';
import { UsersController } from '@/features/users/users.controller';
import { JwtRequest } from '@/models/jwt-request';
import { permissionDeniedError } from '@/utils/errors';

@Controller('/')
export class AppController {
  constructor(
    private readonly assetEditRepo: AssetEditRepo,
    private readonly assetEditService: AssetEditService,
    private readonly userRepo: UserRepo,
    private readonly contactRepo: ContactRepo,
    private readonly assetSearchService: AssetSearchService
  ) {}

  @Get('/oauth-config/config')
  getConfig() {
    return {
      oauth_issuer: process.env.OAUTH_ISSUER,
      oauth_clientId: process.env.OAUTH_CLIENT_ID,
      oauth_scope: process.env.OAUTH_SCOPE,
      oauth_responseType: process.env.OAUTH_RESPONSE_TYPE,
      oauth_showDebugInformation: !!process.env.OAUTH_SHOW_DEBUG_INFORMATION,
      oauth_tokenEndpoint: process.env.OAUTH_TOKEN_ENDPOINT,
    };
  }

  /**
   * @deprecated
   */
  @Get('/user')
  @Redirect('users/current', 301)
  getUser() {
    // deprecated
  }

  /**
   * @deprecated
   */
  @Get('/user/favourite')
  @Redirect('../users/current/favorites', 301)
  async getFavourites() {
    // deprecated
  }

  /**
   * @deprecated
   */
  @Get('/admin/user')
  @Redirect('../users', 301)
  getUsers() {
    // deprecated
  }

  /**
   * @deprecated
   */
  @Patch('/admin/user/:id')
  @RequireRole(Role.Admin)
  updateUser(
    @Param('id') id: UserId,
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    data: UserDataBoundary
  ): Promise<User> {
    return new UsersController(this.userRepo).update(id, data);
  }

  /**
   * @deprecated
   */
  @Delete('/admin/user/:id')
  @RequireRole(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: UserId): Promise<void> {
    await new UsersController(this.userRepo).delete(id);
  }

  /**
   * @deprecated
   */
  @Put('/contact-edit')
  @RequireRole(Role.Editor)
  @HttpCode(HttpStatus.CREATED)
  async createContact(@Body() patch: PatchContact) {
    const data: ContactData = patch;
    const boundary = plainToInstance(ContactDataBoundary, data);
    return new ContactsController(this.contactRepo).create(boundary);
  }

  /**
   * @deprecated
   */
  @Patch('/contact-edit/:id')
  @RequireRole(Role.Editor)
  updateContact(@Param('id', ParseIntPipe) id: ContactId, patch: PatchContact): Promise<Contact> {
    const data: ContactData = patch;
    const boundary = plainToInstance(ContactDataBoundary, data);
    return new ContactsController(this.contactRepo).update(id, boundary);
  }

  /**
   * @deprecated
   */
  @Get('/asset-edit/search')
  async searchAssetsByTitle(@Query('title') title: string): Promise<AssetByTitle[]> {
    try {
      return await this.assetSearchService.searchByTitle(title);
    } catch (e) {
      throw new HttpException(unknownToError(e).message, 500);
    }
  }

  /**
   * @deprecated
   */
  @Get('/asset-edit/:assetId')
  async getAsset(@Param('assetId') assetId: string): Promise<unknown> {
    const id = parseInt(assetId);
    if (isNaN(id)) {
      throw new HttpException('Resource not found', 404);
    }
    const asset = await this.assetEditRepo.find(id);
    if (asset === null) {
      throw new HttpException('Resource not found', 404);
    }
    return AssetEditDetail.encode(asset);
  }

  /**
   * @deprecated
   */
  @Put('/asset-edit')
  async createAsset(@Req() req: JwtRequest, @Body() patchAsset: PatchAsset) {
    const e = await pipe(
      TE.of(req.user as unknown as AssetUser),
      TE.filterOrElseW(
        (user) => isEditor(user),
        () => permissionDeniedError('Not an editor')
      ),
      TE.bindTo('user'),
      TE.bindW('patchAsset', () => TE.fromEither(pipe(PatchAsset.decode(patchAsset), E.mapLeft(decodeError)))),
      TE.chainW(({ patchAsset, user }) => this.assetEditService.createAsset(user, patchAsset))
    )();
    if (E.isLeft(e)) {
      console.error(e.left);
      // if (e.left._tag === 'decodeError') {
      //     throw new HttpException(e.left.message, 400);
      // }
      throw new HttpException(e.left.message, 500);
    }
    return e.right;
  }

  /**
   * @deprecated
   */
  @Patch('/asset-edit/:assetId')
  async updateAsset(@Req() req: JwtRequest, @Param('assetId') id: string, @Body() patchAsset: PatchAsset) {
    const e = await pipe(
      TE.of(req.user as unknown as AssetUser),
      TE.filterOrElseW(
        (user) => isEditor(user),
        () => permissionDeniedError('Not an editor')
      ),
      TE.bindTo('user'),
      TE.bindW('id', () => TE.fromEither(pipe(DT.IntFromString.decode(id), E.mapLeft(decodeError)))),
      TE.bindW('patchAsset', () => TE.fromEither(pipe(PatchAsset.decode(patchAsset), E.mapLeft(decodeError)))),
      TE.chainW(({ id, patchAsset, user }) => this.assetEditService.updateAsset(user, id, patchAsset))
    )();
    if (E.isLeft(e)) {
      console.error(e.left);
      // if (e.left._tag === 'decodeError') {
      //     throw new HttpException(e.left.message, 400);
      // }
      throw new HttpException(e.left.message, 500);
    }
    return e.right;
  }

  /**
   * @deprecated
   */
  @Post('/asset-edit/:assetId/file')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 250 * 1024 * 1024 } }))
  async uploadAssetFile(
    @Req() req: JwtRequest,
    @Param('assetId') id: string,
    @UploadedFile() file: { originalname: string; buffer: Buffer; size: number; mimetype: string }
  ) {
    const e = await pipe(
      TE.of(req.user as unknown as AssetUser),
      TE.filterOrElseW(
        (user) => isEditor(user),
        () => permissionDeniedError('Not an editor')
      ),
      TE.bindTo('user'),
      TE.bindW('id', () => TE.fromEither(pipe(DT.IntFromString.decode(id), E.mapLeft(decodeError)))),
      TE.chainW(({ user, id }) =>
        this.assetEditService.uploadFile(user, id, {
          name: file.originalname,
          buffer: file.buffer,
          size: file.size,
          mimetype: file.mimetype,
        })
      )
    )();
    if (E.isLeft(e)) {
      console.error(e.left);
      // if (e.left._tag === 'decodeError') {
      //     throw new HttpException(e.left.message, 400);
      // }
      throw new HttpException(e.left.message, 500);
    }
    return e.right;
  }

  /**
   * @deprecated
   */
  @Delete('/asset-edit/:assetId/file/:fileId')
  async deleteAssetFile(@Req() req: JwtRequest, @Param('assetId') assetId: string, @Param('fileId') fileId: string) {
    const e = await pipe(
      TE.of(req.user as unknown as AssetUser),
      TE.filterOrElseW(
        (user) => isEditor(user),
        () => permissionDeniedError('Not an editor')
      ),
      TE.bindTo('user'),
      TE.bindW('assetId', () => TE.fromEither(pipe(DT.IntFromString.decode(assetId), E.mapLeft(decodeError)))),
      TE.bindW('fileId', () => TE.fromEither(pipe(DT.IntFromString.decode(fileId), E.mapLeft(decodeError)))),
      TE.chainW(({ user, assetId, fileId }) => this.assetEditService.deleteFile(user, assetId, fileId))
    )();
    if (E.isLeft(e)) {
      console.error(e.left);
      // if (e.left._tag === 'decodeError') {
      //     throw new HttpException(e.left.message, 400);
      // }
      throw new HttpException(e.left.message, 500);
    }
    return e.right;
  }
}
