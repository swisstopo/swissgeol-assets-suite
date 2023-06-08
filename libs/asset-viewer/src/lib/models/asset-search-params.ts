import queryString from 'query-string';

import { AssetSearchParams } from '@asset-sg/shared';

export const AssetSearchParamsToQueryString = {
    encode: (assetSearchParams: AssetSearchParams) =>
        queryString.stringify(AssetSearchParams.encode(assetSearchParams)),
};
