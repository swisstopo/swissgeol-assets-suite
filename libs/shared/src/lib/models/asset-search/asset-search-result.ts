import { AssetEditDetail } from '../asset-edit';
import { DateRange } from '../date-range';
import { UsageCode } from '../usage';

import { GeometryCode } from './asset-search-query';

export interface AssetSearchResult {
  page: PageStats;
  data: AssetEditDetail[];
}

export interface PageStats {
  size: number;
  offset: number;
  total: number;
}

export interface AssetSearchStats {
  total: number;
  authorIds: ValueCount<number>[];
  assetKindItemCodes: ValueCount<string>[];
  languageItemCodes: ValueCount<string>[];
  geometryCodes: ValueCount<GeometryCode | 'None'>[];
  manCatLabelItemCodes: ValueCount<string>[];
  usageCodes: ValueCount<UsageCode>[];
  workgroupIds: ValueCount<number>[];
  createDate: DateRange | null;
}

export interface ValueCount<T> {
  value: T;
  count: number;
}

export const makeEmptyAssetSearchResults = (): AssetSearchResult => ({
  page: {
    size: 0,
    offset: 0,
    total: 0,
  },
  data: [],
});
