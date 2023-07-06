import { Controller, Get, HttpException, Param, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import * as E from 'fp-ts/Either';
import * as D from 'io-ts/Decoder';

import { DT } from '@asset-sg/core';

import { AppService } from './app.service';
import { isNotFoundError } from './errors';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get('all-study')
    getAllStudies() {
        return this.appService.getAllStudies();
    }

    @Get('search-asset')
    async searchAsset(@Query('searchText') searchText: string) {
        const e = await this.appService.searchAssets(searchText)();
        if (E.isLeft(e)) {
            console.error(e.left);
            throw new HttpException(e.left.message, 500);
        }
        return e.right;
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
        const e = await this.appService.searchAssets2(req.query)();
        if (E.isLeft(e)) {
            console.error(e.left);
            throw new HttpException(e.left.message, 500);
        }
        return e.right;
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
            console.log(JSON.stringify(e.left));
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
