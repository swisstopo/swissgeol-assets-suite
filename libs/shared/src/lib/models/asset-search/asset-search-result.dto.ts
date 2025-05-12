// todo LME: These types should be moved to v2 when refactoring is prioritized, since they rely on io-ts types
import { Type } from 'class-transformer';
import { DateRangeDTO } from '../date-range.dto';
import { UsageCode } from '../usage';

import { GeometryCode } from './asset-search-query';
import { AssetSearchStats, ValueCount } from './asset-search-result';

export class AssetSearchStatsDTO implements AssetSearchStats {
  total!: number;
  authorIds!: ValueCount<number>[];
  assetKindItemCodes!: ValueCount<string>[];
  languageItemCodes!: ValueCount<string>[];
  geometryCodes!: ValueCount<GeometryCode>[];
  manCatLabelItemCodes!: ValueCount<string>[];
  usageCodes!: ValueCount<UsageCode>[];
  workgroupIds!: ValueCount<number>[];
  categories!: ValueCount<'favorites'>[];

  @Type(() => DateRangeDTO)
  createDate!: DateRangeDTO | null;
}
