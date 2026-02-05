import { WorkflowStatus } from '@swissgeol/ui-core';
import { Type } from 'class-transformer';

import { IsArray, IsInt, IsObject } from 'class-validator';
import { AssetSearchUsageCode } from '../../models/asset-search/asset-search-query';
import { AssetSearchStats, ValueCount } from '../../models/asset-search/asset-search-stats';
import { ContactId } from '../../models/contact';
import { GeometryType } from '../../models/geometry';
import { LocalizedItemCode } from '../../models/localized-item';
import { WorkgroupId } from '../../models/workgroup';
import { LocalDateRangeSchema } from '../base/local-date-range.schema';
import { Schema } from '../base/schema';

export class AssetSearchStatsSchema extends Schema implements AssetSearchStats {
  @IsInt()
  total!: number;

  @IsArray()
  @IsObject({ each: true })
  authorIds!: ValueCount<ContactId>[];

  @IsArray()
  @IsObject({ each: true })
  kindCodes!: ValueCount<LocalizedItemCode>[];

  @IsArray()
  @IsObject({ each: true })
  languageCodes!: ValueCount<LocalizedItemCode>[];

  @IsArray()
  @IsObject({ each: true })
  geometryTypes!: ValueCount<GeometryType>[];

  @IsArray()
  @IsObject({ each: true })
  topicCodes!: ValueCount<LocalizedItemCode>[];

  @IsArray()
  @IsObject({ each: true })
  usageCodes!: ValueCount<AssetSearchUsageCode>[];

  @IsArray()
  @IsObject({ each: true })
  workgroupIds!: ValueCount<WorkgroupId>[];

  @Type(() => LocalDateRangeSchema)
  createdAt!: LocalDateRangeSchema | null;

  @IsArray()
  @IsObject({ each: true })
  status!: ValueCount<WorkflowStatus>[];
}
