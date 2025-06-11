import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator';
import { Asset, AssetId, AssetLegacyData } from '../models/asset';
import { AssetFile } from '../models/asset-file';
import { AssetIdentifier } from '../models/asset-identifier';
import { LocalDate } from '../models/base/local-date';
import { AssetContact } from '../models/contact';
import { LocalizedItemCode } from '../models/localized-item';
import { UserId } from '../models/user';
import { WorkgroupId } from '../models/workgroup';
import { IsNullable, messageNullableInt, messageNullableString } from '../utils/class-validator/is-nullable.decorator';
import { AssetContactSchema } from './asset-contact.schema';
import { AssetFileSchema } from './asset-file.schema';
import { AssetIdentifierSchema } from './asset-identifier.schema';
import { Schema } from './base/schema';

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
  kindCode!: LocalizedItemCode;

  @IsArray()
  @IsString({ each: true })
  languageCodes!: LocalizedItemCode[];

  @IsArray()
  @IsString({ each: true })
  nationalInterestTypes!: LocalizedItemCode[];

  @IsArray()
  @IsString({ each: true })
  topics!: LocalizedItemCode[];

  @IsObject()
  @ValidateNested()
  @Type(() => AssetIdentifierSchema)
  identifiers!: AssetIdentifier[];

  @IsObject()
  @ValidateNested()
  @Type(() => AssetFileSchema)
  files!: AssetFile[];

  @IsObject()
  @ValidateNested()
  @Type(() => AssetContactSchema)
  contacts!: AssetContact[];

  @IsInt({ message: messageNullableInt })
  @IsNullable()
  parentId!: AssetId | null;

  @IsArray()
  @IsInt({ message: messageNullableInt, each: true })
  siblingIds!: AssetId[];

  @IsInt()
  workgroupId!: WorkgroupId;

  @IsString({ message: messageNullableString })
  @IsNullable()
  creatorId!: UserId | null;

  @ValidateNested()
  @Type(() => String)
  @Transform(({ value }) => LocalDate.tryParse(value))
  createdAt!: LocalDate;

  @ValidateNested()
  @Type(() => String)
  @Transform(({ value }) => LocalDate.tryParse(value))
  receivedAt!: LocalDate;
}
