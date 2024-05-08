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

import { DT, decodeError, unknownToError } from '@asset-sg/core';
import { AssetByTitle, PatchAsset, isEditor } from '@asset-sg/shared';

import { permissionDeniedError } from '../errors';
import { AuthenticatedRequest } from '../models/request';
import { AssetRepo } from '../repos/asset.repo';
import { AssetSearchService } from '../search/asset-search-service';
import { UserService } from '../user/user.service';

import { AssetEditDetail, AssetEditService } from './asset-edit.service';


@Controller('asset-edit')
export class AssetEditController {
    constructor(
        private readonly assetRepo: AssetRepo,
        private readonly assetEditService: AssetEditService,
        private readonly assetSearchService: AssetSearchService,
        private readonly userService: UserService,
    ) {}

    @Get('search')
    async searchForAssetByTitle(@Query('title') title: string): Promise<AssetByTitle[]> {
        try {
            return await this.assetSearchService.searchByTitle(title);
        } catch (e) {
            throw new HttpException(unknownToError(e).message, 500);
        }
    }

    @Get(':assetId')
    async getAsset(@Param('assetId') assetId: string): Promise<unknown> {
        const id = parseInt(assetId);
        if (isNaN(id)) {
            throw new HttpException('Resource not found', 404);
        }
        console.log(id);
        const asset = await this.assetRepo.find(id);
        if (asset === null) {
            throw new HttpException('Resource not found', 404);
        }
        return AssetEditDetail.encode(asset)
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
