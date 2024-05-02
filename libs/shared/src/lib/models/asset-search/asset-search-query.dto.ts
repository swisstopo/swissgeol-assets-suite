import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';


import { PartialDateRangeDTO } from '../date-range.dto';

import { AssetSearchQuery, GeometryCode, Polygon } from './asset-search-query';
import { UsageCode } from '../usage';

export class AssetSearchQueryDTO implements AssetSearchQuery {
  @IsString()
  @IsOptional()
  text?: string

  @IsOptional()
  polygon?: Polygon

  @IsNumber()
  @IsOptional()
  authorId?: number

  @IsString({ each: true })
  @IsOptional()
  manCatLabelItemCodes?: string[]

  @IsString({ each: true })
  @IsOptional()
  assetKindItemCodes?: string[]

  @IsString({ each: true })
  @IsOptional()
  usageCodes?: UsageCode[]

  @IsOptional()
  @IsEnum(GeometryCode, { each: true })
  geomCodes?: Array<GeometryCode | 'None'>

  @IsString({ each: true })
  @IsOptional()
  languageItemCodes?: string[]

  @IsOptional()
  @ValidateNested()
  @Type(() => PartialDateRangeDTO)
  createDate?: PartialDateRangeDTO
}
