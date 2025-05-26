import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  AssetData,
  AssetIdentifierData,
  AssetLinksData,
  AssetUsage,
  AssetUsages,
  ContactAssignment,
  ContactAssignmentRole,
  InfoGeol,
  StudyData,
  UsageStatusCode,
  WorkStatusData,
} from '../models/asset';
import { LocalDate } from '../models/base/local-date';
import { StudyType } from '../models/study';
import { IsNullable, messageNullableInt, messageNullableString } from '../utils/class-validator/is-nullable.decorator';
import { Schema } from './base/schema';

export class AssetUsageSchema extends Schema implements AssetUsage {
  @IsBoolean()
  isAvailable!: boolean;

  @IsEnum(UsageStatusCode)
  statusCode!: UsageStatusCode;

  @IsNullable()
  @ValidateNested()
  @Type(() => String)
  @Transform(({ value }) => LocalDate.parse(value))
  availableAt!: LocalDate | null;
}

export class AssetUsagesSchema extends Schema implements AssetUsages {
  @IsObject()
  @ValidateNested()
  @Type(() => AssetUsageSchema)
  public!: AssetUsageSchema;

  @IsObject()
  @ValidateNested()
  @Type(() => AssetUsageSchema)
  internal!: AssetUsageSchema;
}

export class InfoGeolSchema extends Schema implements InfoGeol {
  @IsString({ message: messageNullableString })
  @IsNullable()
  main!: string | null;

  @IsString({ message: messageNullableString })
  @IsNullable()
  contact!: string | null;

  @IsString({ message: messageNullableString })
  @IsNullable()
  auxiliary!: string | null;
}

export class ContactAssignmentSchema extends Schema implements ContactAssignment {
  @IsInt()
  contactId!: number;

  @IsEnum(ContactAssignmentRole)
  role!: ContactAssignmentRole;
}

export class StudyDataSchema extends Schema implements StudyData {
  @IsInt({ message: messageNullableInt })
  @IsNullable()
  id?: number | undefined;

  @IsString()
  geom!: string;

  @IsEnum(StudyType)
  type!: StudyType;
}

export class WorkStatusSchema extends Schema implements WorkStatusData {
  @IsInt({ message: messageNullableInt })
  @IsNullable()
  id?: number | undefined;

  @IsDate()
  @Type(() => Date)
  createdAt!: Date;

  @IsString()
  itemCode!: string;
}

export class AssetIdentifierSchema extends Schema implements AssetIdentifierData {
  @IsInt({ message: messageNullableInt })
  @IsNullable()
  id?: number | undefined;

  @IsString()
  name!: string;

  @IsString()
  description!: string;
}

export class AssetLinksDataSchema extends Schema implements AssetLinksData {
  @IsInt({ message: messageNullableInt })
  @IsNullable()
  parent!: number | null;

  @IsInt({ each: true })
  siblings!: number[];
}

export class AssetDataSchema extends Schema implements AssetData {
  @IsObject()
  @ValidateNested()
  @Type(() => AssetLinksDataSchema)
  links!: AssetLinksDataSchema;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetIdentifierSchema)
  identifiers!: AssetIdentifierSchema[];

  @IsBoolean()
  @IsNullable()
  isPublic!: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudyDataSchema)
  studies!: StudyDataSchema[];

  @IsString()
  title!: string;

  @IsString({ message: messageNullableString })
  @IsNullable()
  originalTitle!: string | null;

  @IsString()
  kindCode!: string;

  @IsString()
  formatCode!: string;

  @IsString({ each: true })
  languageCodes!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactAssignmentSchema)
  contactAssignments!: ContactAssignmentSchema[];

  @IsString({ each: true })
  manCatLabelCodes!: string[];

  @IsString({ each: true })
  natRelCodes!: string[];

  @ValidateNested()
  @Type(() => String)
  @Transform(({ value }) => LocalDate.tryParse(value))
  createdAt!: LocalDate;

  @ValidateNested()
  @Type(() => String)
  @Transform(({ value }) => LocalDate.tryParse(value))
  receivedAt!: LocalDate;

  @IsInt({ message: messageNullableInt })
  @IsNullable()
  sgsId!: number | null;

  @IsString({ message: messageNullableString })
  @IsNullable()
  municipality!: string | null;

  @IsBoolean()
  isNatRel!: boolean;

  @IsObject()
  @ValidateNested()
  @Type(() => InfoGeolSchema)
  infoGeol!: InfoGeolSchema;

  @IsObject()
  @ValidateNested()
  @Type(() => AssetUsagesSchema)
  usage!: AssetUsagesSchema;

  @IsNumber()
  workgroupId!: number;
}
