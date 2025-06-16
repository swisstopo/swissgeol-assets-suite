import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator';
import { Asset, AssetData, AssetId, AssetLegacyData, LinkedAsset } from '../models/asset';
import { AssetFile, AssetFileId } from '../models/asset-file';
import { AssetIdentifier, AssetIdentifierData } from '../models/asset-identifier';
import { LocalDate } from '../models/base/local-date';
import { AssetContact } from '../models/contact';
import { Geometry, GeometryData, GeometryUpdate } from '../models/geometry';
import { LocalizedItemCode } from '../models/localized-item';
import { UserId } from '../models/user';
import { WorkgroupId } from '../models/workgroup';
import { IsNullable, messageNullableInt, messageNullableString } from '../utils/class-validator/is-nullable.decorator';
import { AssetContactSchema } from './asset-contact.schema';
import { AssetFileSchema } from './asset-file.schema';
import { AssetIdentifierSchema, TransformAssetIdentifier } from './asset-identifier.schema';
import { Schema, TransformLocalDate } from './base/schema';
import { GeometrySchema, TransformGeometryData } from './geometry.schema';

export class AssetLegacyDataSchema extends Schema implements AssetLegacyData {
  @IsInt({ message: messageNullableInt })
  @IsNullable()
  sgsId!: number | null;

  @IsString({ message: messageNullableString })
  @IsNullable()
  data!: string | null;

  @IsString({ message: messageNullableString })
  @IsNullable()
  contactData!: string | null;

  @IsString({ message: messageNullableString })
  @IsNullable()
  auxiliaryData!: string | null;

  @IsString({ message: messageNullableString })
  @IsNullable()
  municipality!: string | null;
}

export class LinkedAssetSchema extends Schema implements LinkedAsset {
  @IsInt()
  id!: number;

  @IsString()
  @IsNotEmpty()
  title!: string;
}

export class AssetSchema extends Schema implements Asset {
  @IsInt()
  id!: number;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString({ message: messageNullableString })
  @IsNullable()
  originalTitle!: string | null;

  @IsBoolean()
  isOfNationalInterest!: boolean;

  @IsBoolean()
  isPublic!: boolean;

  @IsBoolean()
  isExtract!: boolean;

  @IsObject()
  @ValidateNested()
  @Type(() => AssetLegacyDataSchema)
  legacyData!: AssetLegacyData | null;

  @IsString()
  formatCode!: LocalizedItemCode;

  @IsString()
  kindCode!: LocalizedItemCode;

  @IsArray()
  @IsString({ each: true })
  languageCodes!: LocalizedItemCode[];

  @IsArray()
  @IsString({ each: true })
  nationalInterestTypeCodes!: LocalizedItemCode[];

  @IsArray()
  @IsString({ each: true })
  topicCodes!: LocalizedItemCode[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetIdentifierSchema)
  identifiers!: AssetIdentifier[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetFileSchema)
  files!: AssetFile[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetContactSchema)
  contacts!: AssetContact[];

  @IsObject()
  @ValidateNested()
  @IsNullable()
  @Type(() => LinkedAssetSchema)
  parentId!: LinkedAsset | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkedAssetSchema)
  childrenIds!: LinkedAsset[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkedAssetSchema)
  siblingIds!: LinkedAsset[];

  @IsInt()
  workgroupId!: WorkgroupId;

  @IsString({ message: messageNullableString })
  @IsNullable()
  creatorId!: UserId | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GeometrySchema)
  geometries!: Geometry[];

  @TransformLocalDate()
  createdAt!: LocalDate;

  @TransformLocalDate()
  receivedAt!: LocalDate;
}

export class AssetDataSchema extends Schema implements AssetData {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString({ message: messageNullableString })
  @IsNullable()
  originalTitle!: string | null;

  @IsBoolean()
  isOfNationalInterest!: boolean;

  @IsBoolean()
  isPublic!: boolean;

  @IsBoolean()
  isExtract!: boolean;

  @IsObject()
  @ValidateNested()
  @Type(() => AssetLegacyDataSchema)
  legacyData!: AssetLegacyData | null;

  @IsString()
  formatCode!: LocalizedItemCode;

  @IsString()
  kindCode!: LocalizedItemCode;

  @IsArray()
  @IsString({ each: true })
  languageCodes!: LocalizedItemCode[];

  @IsArray()
  @IsString({ each: true })
  nationalInterestTypeCodes!: LocalizedItemCode[];

  @IsArray()
  @IsString({ each: true })
  topicCodes!: LocalizedItemCode[];

  @IsArray()
  @ValidateNested({ each: true })
  @TransformAssetIdentifier({ each: true })
  identifiers!: Array<AssetIdentifier | AssetIdentifierData>;

  @IsArray()
  @IsInt({ each: true })
  files!: AssetFileId[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetContactSchema)
  contacts!: AssetContact[];

  @IsInt({ message: messageNullableInt })
  @IsNullable()
  parentId!: AssetId | null;

  @IsArray()
  @IsInt({ each: true })
  childrenIds!: AssetId[];

  @IsArray()
  @IsInt({ each: true })
  siblingIds!: AssetId[];

  @IsInt()
  workgroupId!: WorkgroupId;

  @IsArray()
  @ValidateNested({ each: true })
  @TransformGeometryData()
  geometries!: Array<GeometryData | GeometryUpdate>;

  @TransformLocalDate()
  createdAt!: LocalDate;

  @TransformLocalDate()
  receivedAt!: LocalDate;
}
