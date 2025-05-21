import { DateRange } from '../date-range';
import { UsageCode } from '../usage';

import { GeometryCode } from './asset-search-query';

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

export const makeEmptyAssetSearchStats = (): AssetSearchStats => ({
  total: 0,
  authorIds: [],
  assetKindItemCodes: [],
  languageItemCodes: [],
  geometryCodes: [],
  manCatLabelItemCodes: [],
  usageCodes: [],
  workgroupIds: [],
  createDate: null,
});
