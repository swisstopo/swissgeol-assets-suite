import { isNotNull, unknownToUnknownError } from '@asset-sg/core';
import { BaseAssetEditDetail, PatchAsset } from '@asset-sg/shared';
import { User } from '@asset-sg/shared/v2';
import { Injectable } from '@nestjs/common';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as C from 'io-ts/Codec';

import { AssetEditRepo } from './asset-edit.repo';
import { AssetSearchService } from '@/features/assets/search/asset-search.service';
import { notFoundError } from '@/utils/errors';

export const AssetEditDetail = C.struct({
  ...BaseAssetEditDetail,
  studies: C.array(C.struct({ assetId: C.number, studyId: C.string, geomText: C.string })),
});
export type AssetEditDetail = C.TypeOf<typeof AssetEditDetail>;

@Injectable()
export class AssetEditService {
  constructor(private readonly assetEditRepo: AssetEditRepo, private readonly assetSearchService: AssetSearchService) {}

  public createAsset(user: User, patch: PatchAsset) {
    return pipe(
      TE.tryCatch(() => this.assetEditRepo.create({ user, patch }), unknownToUnknownError),
      TE.chain(({ assetId }) => TE.tryCatch(() => this.assetEditRepo.find(assetId), unknownToUnknownError)),
      TE.chainW(TE.fromPredicate(isNotNull, notFoundError)),
      TE.tap((asset) => TE.tryCatch(() => this.assetSearchService.register(asset), unknownToUnknownError)),
      TE.map((asset) => AssetEditDetail.encode(asset))
    );
  }

  public updateAsset(user: User, assetId: number, patch: PatchAsset) {
    return pipe(
      TE.tryCatch(() => this.assetEditRepo.update(assetId, { user, patch }), unknownToUnknownError),
      TE.chainW(TE.fromPredicate(isNotNull, notFoundError)),
      TE.tap((asset) => TE.tryCatch(() => this.assetSearchService.register(asset), unknownToUnknownError)),
      TE.map((asset) => AssetEditDetail.encode(asset))
    );
  }
}
