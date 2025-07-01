import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator';
import {
  Asset,
  AssetData,
  AssetId,
  AssetLegacyData,
  CreateAssetData,
  LinkedAsset,
  UpdateAssetData,
} from '../models/asset';
import { AssetFile, UpdateAssetFileData } from '../models/asset-file';
import { AssetIdentifier, AssetIdentifierData } from '../models/asset-identifier';
import { LocalDate } from '../models/base/local-date';
import { AssetContact } from '../models/contact';
import { CreateGeometryData, Geometry, GeometryData } from '../models/geometry';
import { LocalizedItemCode } from '../models/localized-item';
import { LanguageCode } from '../models/reference-data';
import { UserId } from '../models/user';
import { WorkgroupId } from '../models/workgroup';
import { IsNullable, messageNullableInt, messageNullableString } from '../utils/class-validator/is-nullable.decorator';
import { AssetContactSchema } from './asset-contact.schema';
import { AssetFileSchema, UpdateAssetFileDataSchema } from './asset-file.schema';
import { AssetIdentifierSchema, TransformAssetIdentifier } from './asset-identifier.schema';
import { Schema, TransformLocalDate } from './base/schema';
import { GeometrySchema, GeometryDataType, CreateGeometryDataSchema } from './geometry.schema';

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

  @IsObject()
  @ValidateNested()
  @Type(() => AssetLegacyDataSchema)
  legacyData!: AssetLegacyData | null;

  @IsString()
  formatCode!: LocalizedItemCode;

  @IsString()
  kindCode!: LocalizedItemCode;

  @IsArray()
  @IsEnum(LanguageCode, { each: true })
  languageCodes!: LanguageCode[];

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
  parent!: LinkedAsset | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkedAssetSchema)
  children!: LinkedAsset[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkedAssetSchema)
  siblings!: LinkedAsset[];

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

class AssetDataSchema extends Schema implements AssetData {
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

  @IsString()
  formatCode!: LocalizedItemCode;

  @IsString()
  kindCode!: LocalizedItemCode;

  @IsArray()
  @IsEnum(LanguageCode, { each: true })
  languageCodes!: LanguageCode[];

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
  @ValidateNested({ each: true })
  @Type(() => AssetContactSchema)
  contacts!: AssetContact[];

  @IsInt({ message: messageNullableInt })
  @IsNullable()
  parent!: AssetId | null;

  @IsArray()
  @IsInt({ each: true })
  siblings!: AssetId[];

  @IsInt()
  workgroupId!: WorkgroupId;

  @TransformLocalDate()
  createdAt!: LocalDate;

  @TransformLocalDate()
  receivedAt!: LocalDate;
}

export class CreateAssetDataSchema extends AssetDataSchema implements CreateAssetData {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGeometryDataSchema)
  geometries!: CreateGeometryData[];
}

export class UpdateAssetDataSchema extends AssetDataSchema implements UpdateAssetData {
  @IsArray()
  @ValidateNested({ each: true })
  @GeometryDataType()
  geometries!: GeometryData[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAssetFileDataSchema)
  files!: UpdateAssetFileData[];
}
