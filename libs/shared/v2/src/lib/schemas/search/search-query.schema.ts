import { WorkflowStatus } from '@swissgeol/ui-core';
import { Type } from 'class-transformer';
import { Equals, IsBoolean, IsEnum, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AssetId } from '../../models/asset';
import { GeometryType } from '../../models/geometry';
import { LocalizedItemCode } from '../../models/localized-item';
import {
  AssetFilters,
  AssetSearchQuery,
  AssetSearchUsageCode,
  FileSearchQuery,
  Polygon,
  SearchType,
} from '../../models/search/search-query';
import { WorkgroupId } from '../../models/workgroup';

import { PartialDateRangeSchema } from '../base/local-date-range.schema';
import { Schema } from '../base/schema';

export class AssetFiltersSchema extends Schema implements AssetFilters {
  @IsNumber({}, { each: true })
  @IsOptional()
  assetIds?: AssetId[];

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

  @IsOptional()
  @IsIn(Object.values(WorkflowStatus), { each: true })
  status?: Array<WorkflowStatus>;
}

export class AssetSearchQuerySchema extends AssetFiltersSchema implements AssetSearchQuery {
  @Equals(SearchType.Asset)
  type: SearchType.Asset = SearchType.Asset;

  @IsString()
  @IsOptional()
  text?: string;
}

export class FileSearchQuerySchema extends AssetFiltersSchema implements FileSearchQuery {
  @Equals(SearchType.File)
  type: SearchType.File = SearchType.File;

  @IsString()
  @IsOptional()
  text?: string;
}

export class SearchQuerySchema extends Schema {
  @IsEnum(SearchType)
  type: SearchType = SearchType.Asset;
}
