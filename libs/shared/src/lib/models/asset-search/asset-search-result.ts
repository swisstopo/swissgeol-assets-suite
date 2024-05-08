import { AssetEditDetail } from "../asset-edit"
import { DateRange } from '../date-range';
import { UsageCode } from '../usage';

export interface AssetSearchResult {
  page: PageStats
  data: AssetEditDetail[]
}

export interface PageStats {
  size: number
  offset: number
  total: number
}

export interface AssetSearchStats {
  total: number
  authorIds: ValueCount<number>[]
  assetKindItemCodes: ValueCount<string>[]
  languageItemCodes: ValueCount<string>[]
  usageCodes: ValueCount<UsageCode>[]
  manCatLabelItemCodes: ValueCount<string>[]
  createDate: DateRange | null,
}

export interface ValueCount<T> {
  value: T
  count: number
}
