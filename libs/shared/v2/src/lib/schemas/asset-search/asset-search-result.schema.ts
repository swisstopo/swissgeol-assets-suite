import { Expose, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsString, ValidateNested } from 'class-validator';
import { AssetId } from '../../models/asset';
import {
  AssetSearchResult,
  AssetSearchResultContact,
  AssetSearchResultGeometry,
  AssetSearchResultItem,
  PageStats,
} from '../../models/asset-search/asset-search-result';
import { LocalDate } from '../../models/base/local-date';
import { AssetContactRole, ContactId } from '../../models/contact';
import { GeometryDetail, GeometryId } from '../../models/geometry';
import { LocalizedItemCode } from '../../models/localized-item';
import { Schema, TransformLocalDate } from '../base/schema';
import { GeometryDetailSchema } from '../geometry.schema';

export class AssetSearchResultGeometrySchema extends Schema implements AssetSearchResultGeometry {
  @Expose()
  @IsString()
  id!: GeometryId;

  @Expose()
  @IsString()
  geomText!: string;
}

export class AssetSearchResultContactSchema extends Schema implements AssetSearchResultContact {
  @Expose()
  @IsNumber()
  id!: ContactId;

  @Expose()
  @IsEnum(AssetContactRole)
  role!: AssetContactRole;
}

export class AssetSearchResultItemSchema extends Schema implements AssetSearchResultItem {
  @Expose()
  @IsNumber()
  id!: AssetId;

  @Expose()
  @IsString()
  title!: string;

  @Expose()
  @IsBoolean()
  isPublic!: boolean;

  @Expose()
  @IsString()
  kindCode!: LocalizedItemCode;

  @Expose()
  @IsString()
  formatCode!: LocalizedItemCode;

  @Expose()
  @IsArray()
  @IsString({ each: true })
  topicCodes!: LocalizedItemCode[];

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetSearchResultContactSchema)
  contacts!: AssetSearchResultContact[];

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GeometryDetailSchema)
  geometries!: GeometryDetail[];

  @Expose()
  @TransformLocalDate()
  createdAt!: LocalDate;
}

export class AssetSearchResultSchema extends Schema implements AssetSearchResult {
  @Expose()
  page!: PageStats;

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetSearchResultItemSchema)
  data!: AssetSearchResultItem[];
}
