import { AssetEditDetail } from "../asset-edit"
import { DateRange } from '../date-range';
import { UsageCode } from '../usage';

export interface AssetSearchResult {
  page: PageStats
  data: AssetEditDetail[]
  stats: AssetSearchStats | null
}

export interface PageStats {
  size: number
  offset: number
  total: number
}

export interface AssetSearchStats {
  authorIds: ValueCount<number>[]
  assetKindItemCodes: ValueCount<string>[]
  languageItemCodes: ValueCount<string>[]
  usageCodes: ValueCount<UsageCode>[]
  manCatLabelItemCodes: ValueCount<string>[]
  createDate: DateRange,
}

export interface ValueCount<T> {
  value: T
  count: number
}
