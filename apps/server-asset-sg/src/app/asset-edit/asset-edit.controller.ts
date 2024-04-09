import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    Param,
    Patch,
    Post,
    Put,
    Query,
    Req,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as D from 'io-ts/Decoder';

import { decodeError, DT } from '@asset-sg/core';
import { isEditor, PatchAsset } from '@asset-sg/shared';

import { isNotFoundError, permissionDeniedError } from '../errors';
import { AuthenticatedRequest } from '../models/request';
import { UserService } from '../user/user.service';

import { AssetEditService } from './asset-edit.service';

@Controller('asset-edit')
export class AssetEditController {
    constructor(private readonly assetEditService: AssetEditService, private readonly userService: UserService) {}

    @Get('search')
    async searchForAssetByTitle(@Query('title') title: string) {
        const maybeTitle = D.string.decode(title);
        if (E.isLeft(maybeTitle)) {
            throw new HttpException(D.draw(maybeTitle.left), 400);
        }

        const e = await this.assetEditService.searchForAssetByTitle(title)();
        if (E.isLeft(e)) {
            console.error(e.left);
            throw new HttpException(e.left.message, 500);
        }
        return e.right;
    }

    @Get(':assetId')
    async getAsset(@Param('assetId') assetId: string) {
        const maybeAssetId = DT.IntFromString.decode(assetId);
        if (E.isLeft(maybeAssetId)) {
            throw new HttpException(D.draw(maybeAssetId.left), 400);
        }

        const e = await this.assetEditService.getAsset(maybeAssetId.right)();
        if (E.isLeft(e)) {
            console.error(e.left);
            if (isNotFoundError(e.left)) {
                throw new HttpException('Resource not found', 400);
            }
            throw new HttpException(e.left.message, 500);
        }
        return e.right;
    }

    @Put()
    async createAsset(@Req() req: AuthenticatedRequest, @Body() patchAsset: PatchAsset) {
        const e = await pipe(
            this.userService.getUser(req.jwtPayload.sub || ''),
            TE.filterOrElseW(
                user => isEditor(user),
                () => permissionDeniedError('Not an editor'),
            ),
            TE.bindTo('user'),
            TE.bindW('patchAsset', () => TE.fromEither(pipe(PatchAsset.decode(patchAsset), E.mapLeft(decodeError)))),
            TE.chainW(({ patchAsset, user }) => this.assetEditService.createAsset(user, patchAsset)),
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

    @Post(':assetId/file')
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 250 * 1024 * 1024 } }))
    async uploadFile(
        @Req() req: AuthenticatedRequest,
        @Param('assetId') id: string,
        @UploadedFile() file: { originalname: string; buffer: Buffer; size: number; mimetype: string },
    ) {
        const e = await pipe(
            this.userService.getUser(req.jwtPayload.sub || ''),
            TE.filterOrElseW(
                user => isEditor(user),
                () => permissionDeniedError('Not an editor'),
            ),
            TE.bindTo('user'),
            TE.bindW('id', () => TE.fromEither(pipe(DT.IntFromString.decode(id), E.mapLeft(decodeError)))),
            TE.chainW(({ user, id }) =>
                this.assetEditService.uploadFile(user, id, {
                    name: file.originalname,
                    buffer: file.buffer,
                    size: file.size,
                    mimetype: file.mimetype,
                }),
            ),
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

    @Delete(':assetId/file/:fileId')
    async deleteFile(
        @Req() req: AuthenticatedRequest,
        @Param('assetId') assetId: string,
        @Param('fileId') fileId: string,
    ) {
        const e = await pipe(
            this.userService.getUser(req.jwtPayload.sub || ''),
            TE.filterOrElseW(
                user => isEditor(user),
                () => permissionDeniedError('Not an editor'),
            ),
            TE.bindTo('user'),
            TE.bindW('assetId', () => TE.fromEither(pipe(DT.IntFromString.decode(assetId), E.mapLeft(decodeError)))),
            TE.bindW('fileId', () => TE.fromEither(pipe(DT.IntFromString.decode(fileId), E.mapLeft(decodeError)))),
            TE.chainW(({ user, assetId, fileId }) => this.assetEditService.deleteFile(user, assetId, fileId)),
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

    @Patch(':assetId')
    async updateAsset(@Req() req: AuthenticatedRequest, @Param('assetId') id: string, @Body() patchAsset: PatchAsset) {
        const e = await pipe(
            this.userService.getUser(req.jwtPayload.sub || ''),
            TE.filterOrElseW(
                user => isEditor(user),
                () => permissionDeniedError('Not an editor'),
            ),
            TE.bindTo('user'),
            TE.bindW('id', () => TE.fromEither(pipe(DT.IntFromString.decode(id), E.mapLeft(decodeError)))),
            TE.bindW('patchAsset', () => TE.fromEither(pipe(PatchAsset.decode(patchAsset), E.mapLeft(decodeError)))),
            TE.chainW(({ id, patchAsset, user }) => this.assetEditService.updateAsset(user, id, patchAsset)),
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
