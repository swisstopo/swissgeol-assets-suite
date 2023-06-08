import * as C from 'io-ts/Codec';
import * as D from 'io-ts/Decoder';

import { CT } from '@asset-sg/core';

import { LV95FromCommaSeparatedString } from './lv95';

export const AssetSearchParamsOld = C.struct({
    searchText: C.string,
});
export type AssetSearchParamsOld = D.TypeOf<typeof AssetSearchParamsOld>;

export const AssetSearchParams = C.sum('filterKind')({
    polygon: C.struct({
        filterKind: C.literal('polygon'),
        polygon: C.array(LV95FromCommaSeparatedString),
        searchText: CT.optionFromUndefinedable(C.string),
    }),
    searchText: C.struct({
        filterKind: C.literal('searchText'),
        searchText: C.string,
    }),
});

export type AssetSearchParams = C.TypeOf<typeof AssetSearchParams>;
