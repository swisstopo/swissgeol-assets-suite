import { AssetSearchParams } from '@asset-sg/shared';
import queryString from 'query-string';

export const AssetSearchParamsToQueryString = {
  encode: (assetSearchParams: AssetSearchParams) => queryString.stringify(AssetSearchParams.encode(assetSearchParams)),
};
