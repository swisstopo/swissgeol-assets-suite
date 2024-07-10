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
} from '@shared/models/asset';
import { LocalDate } from '@shared/models/base/local-date';
import { StudyType } from '@shared/models/study';
import {
  IsNullable,
  messageNullableInt,
  messageNullableString,
} from '@shared/utils/class-validator/is-nullable.decorator';
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

export class AssetUsageSchema implements AssetUsage {
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

export class AssetUsagesSchema implements AssetUsages {
  @IsObject()
  @ValidateNested()
  @Type(() => AssetUsageSchema)
  public!: AssetUsageSchema;

  @IsObject()
  @ValidateNested()
  @Type(() => AssetUsageSchema)
  internal!: AssetUsageSchema;
}

export class InfoGeolSchema implements InfoGeol {
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

export class ContactAssignmentSchema implements ContactAssignment {
  @IsInt()
  contactId!: number;

  @IsEnum(ContactAssignmentRole)
  role!: ContactAssignmentRole;
}

export class StudyDataSchema implements StudyData {
  @IsInt({ message: messageNullableInt })
  @IsNullable()
  id?: number | undefined;

  @IsString()
  geom!: string;

  @IsEnum(StudyType)
  type!: StudyType;
}

export class WorkStatusSchema implements WorkStatusData {
  @IsInt({ message: messageNullableInt })
  @IsNullable()
  id?: number | undefined;

  @IsDate()
  @Type(() => Date)
  createdAt!: Date;

  @IsString()
  itemCode!: string;
}

export class AssetIdentifierSchema implements AssetIdentifierData {
  @IsInt({ message: messageNullableInt })
  @IsNullable()
  id?: number | undefined;

  @IsString()
  name!: string;

  @IsString()
  description!: string;
}

export class AssetLinksDataSchema implements AssetLinksData {
  @IsInt({ message: messageNullableInt })
  @IsNullable()
  parent!: number | null;

  @IsInt({ each: true })
  siblings!: number[];
}

export class AssetDataSchema implements AssetData {
  @IsObject()
  @ValidateNested()
  @Type(() => AssetLinksDataSchema)
  links!: AssetLinksDataSchema;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetIdentifierSchema)
  identifiers!: AssetIdentifierSchema[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkStatusSchema)
  statuses!: WorkStatusSchema[];

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
