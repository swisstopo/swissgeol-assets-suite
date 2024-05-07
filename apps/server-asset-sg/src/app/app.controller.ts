import * as fs from 'fs/promises';

import { Controller, Get, HttpException, OnApplicationBootstrap, Param, Post, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import * as E from 'fp-ts/Either';
import * as D from 'io-ts/Decoder';

import { DT, unknownToError } from '@asset-sg/core';
import { isAdmin } from '@asset-sg/shared';

import { AppService } from './app.service';
import { isNotFoundError } from './errors';
import { AuthenticatedRequest } from './models/request';
import { AssetSearchService } from './search/asset-search-service';
import { UserService } from './user/user.service';

@Controller()
export class AppController implements OnApplicationBootstrap {
    constructor(
        private readonly appService: AppService,
        private readonly userService: UserService,
        private readonly assetSearchService: AssetSearchService,
    ) {}

    async onApplicationBootstrap() {
        const syncFileExists = await fs.access(assetSyncFile).then(() => true).catch(() =>  false);
        if (syncFileExists) {
            void fs.rm(assetSyncFile);
        }
    }

    @Get('all-study')
    getAllStudies() {
        return this.appService.getAllStudies();
    }

    @Get('search-asset')
    async searchAsset(@Query('searchText') searchText: string) {
        try {
            return this.assetSearchService.searchOld(searchText, {
                scope: ['titlePublic', 'titleOriginal', 'contactNames', 'sgsId'],
            })
        } catch (e) {
            const error = unknownToError(e);
            console.error(error);
            throw new HttpException(error.message, 500);
        }
    }

    @Get('asset')
    // async findAssetsByPolygon(@Query() polygon: [number, number][]) {
    async findAssetsByPolygon(@Req() req: Request) {
        // const e = pipe(
        //     TE.fromEither(AssetSearchParams.decode(req.query)),
        //     TE.chainW(a => {
        //         switch (a.filterKind) {
        //             case 'polygon':
        //                 return findAssetsByPolygon(a.polygon);
        //             case 'searchText':
        //                 return TE.of(1);
        //         }
        //     }),
        // );
        // console.log(JSON.stringify(pipe(AssetSearchParams.decode(req.query), E.mapLeft(D.draw)), null, 2));
        // return 'adsf;';
        const e = await this.appService.searchAssets(req.query)();
        if (E.isLeft(e)) {
            console.error(e.left);
            throw new HttpException(e.left.message, 500);
        }
        return e.right;
    }

    @Get('/assets/sync')
    async getAssetSyncProgress(
        @Req() req: AuthenticatedRequest,
        @Res() res: Response,
    ): Promise<{ progress: number } | void> {

        try {
            const data = await fs.readFile(assetSyncFile, { encoding: 'utf-8' });
            const state: AssetSyncState = JSON.parse(data);
            res.status(200).json({ progress: state.progress }).end();
        } catch (e) {
            if ((e as { code?: string }).code === 'ENOENT') {
                res.status(204).end();
                return;
            }
            throw new HttpException(`${e}`, 500);
        }
    }

    @Post('/assets/sync')
    async startAssetSync(@Req() req: AuthenticatedRequest, @Res() res: Response): Promise<void> {
        const userResult = await this.userService.getUser(req.jwtPayload.sub || '')()
        if (E.isLeft(userResult)) {
            throw new HttpException(userResult.left.message, 500);
        }
        const user = userResult.right;
        if (!isAdmin(user)) {
            throw new HttpException('Operation not permitted', 403);
        }
        const isSyncRunning = await fs.access(assetSyncFile).then(() => true).catch(() =>  false);
        if (isSyncRunning) {
            res.status(204).end();
            return;
        }

        const writeProgress = (progress: number): Promise<void> => {
            const state: AssetSyncState = { progress: parseFloat(progress.toFixed(3)) };
            const data = JSON.stringify(state);
            return fs.writeFile(assetSyncFile, data, { encoding: 'utf-8' });
        }

        await writeProgress(0);
        setTimeout(async () => {
            await this.assetSearchService.syncWithDatabase(writeProgress);
            await fs.rm(assetSyncFile);
        });
        res.status(201).end();
    }

    // @Post('find-assets-by-polygon')
    // async findAssetsByPolygon(@Body() polygon: [number, number][]) {
    //     const e = await this.appService.findAssetsByPolygon(polygon)();
    //     if (E.isLeft(e)) {
    //         console.error(e.left);
    //         throw new HttpException(e.left.message, 500);
    //     }
    //     return e.right;
    // }

    @Get('reference-data')
    async getReferenceData() {
        const e = await this.appService.getReferenceData()();
        if (E.isLeft(e)) {
            console.error(e.left);
            throw new HttpException(e.left.message, 500);
        }
        return e.right;
    }

    @Get('asset-detail/:assetId')
    async getAssetDetail(@Param('assetId') assetId: string) {
        const maybeAssetId = DT.IntFromString.decode(assetId);
        if (E.isLeft(maybeAssetId)) {
            throw new HttpException(D.draw(maybeAssetId.left), 400);
        }

        const e = await this.appService.getAssetDetail(maybeAssetId.right)();
        if (E.isLeft(e)) {
            console.error(e.left);
            if (isNotFoundError(e.left)) {
                throw new HttpException('Resource not found', 400);
            }
            throw new HttpException(e.left.message, 500);
        }
        return e.right;
    }

    @Get('file/:fileId')
    async getFile(@Res() res: Response, @Param('fileId') fileId: string) {
        const maybeFileId = DT.IntFromString.decode(fileId);
        if (E.isLeft(maybeFileId)) {
            throw new HttpException(D.draw(maybeFileId.left), 400);
        }

        const e = await this.appService.getFile(maybeFileId.right)();
        if (E.isLeft(e)) {
            throw new HttpException(e.left.message, 500);
        }
        const result = e.right;
        if (result.contentType) {
            res.header('Content-Type', result.contentType);
        }
        if (result.contentLength != null) {
            res.header('Content-Length', result.contentLength.toString());
        }
        res.setHeader('Content-disposition', `filename="${result.fileName}"`);

        e.right.stream.pipe(res);
    }
}

const assetSyncFile = './asset-sync-progress.tmp.json';

interface AssetSyncState {
    progress: number
}
