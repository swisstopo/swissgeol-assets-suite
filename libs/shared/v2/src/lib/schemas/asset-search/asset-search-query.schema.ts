import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import { AssetSearchQuery, AssetSearchUsageCode, Polygon } from '../../models/asset-search/asset-search-query';
import { GeometryType } from '../../models/geometry';
import { LocalizedItemCode } from '../../models/localized-item';
import { WorkgroupId } from '../../models/workgroup';
import { PartialDateRangeSchema } from '../base/local-date-range.schema';
import { Schema } from '../base/schema';

export class AssetSearchQuerySchema extends Schema implements AssetSearchQuery {
  @IsString()
  @IsOptional()
  text?: string;

  @IsOptional()
  polygon?: Polygon;

  @IsNumber()
  @IsOptional()
  authorId?: number;

  @IsString({ each: true })
  @IsOptional()
  topicCodes?: LocalizedItemCode[];

  @IsString({ each: true })
  @IsOptional()
  kindCodes?: LocalizedItemCode[];

  @IsString({ each: true })
  @IsOptional()
  usageCodes?: AssetSearchUsageCode[];

  @IsOptional()
  @IsIn([...Object.values(GeometryType), 'None'], { each: true })
  geometryTypes?: Array<GeometryType | 'None'>;

  @IsString({ each: true })
  @IsOptional()
  languageCodes?: string[];

  @IsNumber({}, { each: true })
  @IsOptional()
  workgroupIds?: WorkgroupId[];

  @IsBoolean()
  @IsOptional()
  favoritesOnly?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => PartialDateRangeSchema)
  createdAt?: PartialDateRangeSchema;
}
