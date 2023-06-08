import * as D from 'io-ts/Decoder';

import { Studies } from './study';

export const AssetSearchResult = D.struct({
    assetId: D.number,
    titlePublic: D.string,
    studies: Studies,
});
export interface AssetSearchResult extends D.TypeOf<typeof AssetSearchResult> {}

export const AssetSearchResults = D.array(AssetSearchResult);
export type AssetSearchResults = D.TypeOf<typeof AssetSearchResults>;
