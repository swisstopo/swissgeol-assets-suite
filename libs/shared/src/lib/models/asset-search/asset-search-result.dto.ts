import { Type } from 'class-transformer';

import { AssetEditDetail } from '../asset-edit';
import { DateRangeDTO } from '../date-range.dto';
import { UsageCode } from '../usage';

import { GeometryCode } from './asset-search-query';
import { AssetSearchResult, AssetSearchStats, PageStats, ValueCount } from './asset-search-result';

export class AssetSearchResultDTO implements AssetSearchResult {
  page!: PageStats;
  data!: AssetEditDetail[];
}

export class AssetSearchStatsDTO implements AssetSearchStats {
  total!: number;
  authorIds!: ValueCount<number>[];
  assetKindItemCodes!: ValueCount<string>[];
  languageItemCodes!: ValueCount<string>[];
  geometryCodes!: ValueCount<GeometryCode>[];
  usageCodes!: ValueCount<UsageCode>[];
  manCatLabelItemCodes!: ValueCount<string>[];

  @Type(() => DateRangeDTO)
  createDate!: DateRangeDTO | null;
}
