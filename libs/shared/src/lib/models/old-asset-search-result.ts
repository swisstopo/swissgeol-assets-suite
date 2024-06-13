import * as D from 'io-ts/Decoder';

import { Studies } from './study';

export const OldAssetSearchResult = D.struct({
  assetId: D.number,
  titlePublic: D.string,
  studies: Studies,
});
export type OldAssetSearchResult = D.TypeOf<typeof OldAssetSearchResult>;

export const OldAssetSearchResults = D.array(OldAssetSearchResult);
export type OldAssetSearchResults = D.TypeOf<typeof OldAssetSearchResults>;
