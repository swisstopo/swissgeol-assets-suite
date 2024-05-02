import { Type } from 'class-transformer';

import { AssetEditDetail } from '../asset-edit';
import { DateRangeDTO } from '../date-range.dto';

import { AssetSearchResult, AssetSearchStats, PageStats, ValueCount } from './asset-search-result';
import { UsageCode } from '../usage';

export class AssetSearchStatsDTO implements AssetSearchStats {
  authorIds!: ValueCount<number>[];
  assetKindItemCodes!: ValueCount<string>[];
  languageItemCodes!: ValueCount<string>[];
  usageCodes!: ValueCount<UsageCode>[];
  manCatLabelItemCodes!: ValueCount<string>[];

  @Type(() => DateRangeDTO)
  createDate!: DateRangeDTO;
}

export class AssetSearchResultDTO implements AssetSearchResult {
  page!: PageStats;
  data!: AssetEditDetail[];

  @Type(() => AssetSearchStatsDTO)
  stats!: AssetSearchStatsDTO;
}
