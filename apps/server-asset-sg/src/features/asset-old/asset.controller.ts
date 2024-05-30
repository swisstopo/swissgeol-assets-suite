import { Controller, Get, HttpException, Param, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import * as E from 'fp-ts/Either';
import * as D from 'io-ts/Decoder';

import { DT, unknownToError } from '@asset-sg/core';

import { AssetService } from '@/features/asset-old/asset.service';
import { AssetSearchService } from '@/features/assets/search/asset-search.service';
import { isNotFoundError } from '@/utils/errors';

@Controller('/')
export class AssetController {
  constructor(
    private readonly assetService: AssetService,
    private readonly assetSearchService: AssetSearchService,
  ) {
  }

  @Get('/asset')
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
    const e = await this.assetService.searchAssets(req.query)();
    if (E.isLeft(e)) {
      console.error(e.left);
      throw new HttpException(e.left.message, 500);
    }
    return e.right;
  }

  @Get('/search-asset')
  async searchAsset(@Query('searchText') searchText: string) {
    try {
      return this.assetSearchService.searchOld(searchText, {
        scope: ['titlePublic', 'titleOriginal', 'contactNames', 'sgsId'],
      });
    } catch (e) {
      const error = unknownToError(e);
      console.error(error);
      throw new HttpException(error.message, 500);
    }
  }

  @Get('/asset-detail/:assetId')
  async getAssetDetail(@Param('assetId') assetId: string) {
    const maybeAssetId = DT.IntFromString.decode(assetId);
    if (E.isLeft(maybeAssetId)) {
      throw new HttpException(D.draw(maybeAssetId.left), 400);
    }

    const e = await this.assetService.getAssetDetail(maybeAssetId.right)();
    if (E.isLeft(e)) {
      console.error(e.left);
      if (isNotFoundError(e.left)) {
        throw new HttpException('Resource not found', 400);
      }
      throw new HttpException(e.left.message, 500);
    }
    return e.right;
  }

  @Get('/all-study')
  getAllStudies() {
    return this.assetService.getAllStudies();
  }

  @Get('/reference-data')
  async getReferenceData() {
    const e = await this.assetService.getReferenceData()();
    if (E.isLeft(e)) {
      console.error(e.left);
      throw new HttpException(e.left.message, 500);
    }
    return e.right;
  }


  @Get('/file/:fileId')
  async getFile(@Res() res: Response, @Param('fileId') fileId: string) {
    const maybeFileId = DT.IntFromString.decode(fileId);
    if (E.isLeft(maybeFileId)) {
      throw new HttpException(D.draw(maybeFileId.left), 400);
    }

    const e = await this.assetService.getFile(maybeFileId.right)();
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
