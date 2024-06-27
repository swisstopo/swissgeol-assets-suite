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

import { IsNullable, messageNullableInt, messageNullableString } from '@/core/decorators/is-nullable.decorator';
import { StudyType } from '@/features/studies/study.model';
import { LocalDate } from '@/utils/data/local-date';
import { Data, Model } from '@/utils/data/model';

// `usageCode` will need to be determined in the frontend - it is no longer included here.
// See `makeUsageCode`.

// `assetFormatCompositions` seems to be fully unused.
// The table on INT is empty, and there's no way to edit it.
// The field would theoretically be displayed in the search, but since it is empty,
// it's always skipped.

export interface AssetInfo extends Model<AssetId> {
  title: string;
  originalTitle: string | null;

  kindCode: string;
  formatCode: string;
  identifiers: AssetIdentifier[];
  languageCodes: string[];
  contactAssignments: ContactAssignment[];
  manCatLabelCodes: string[];
  natRelCodes: string[];
  links: AssetLinks;
  files: FileReference[];

  createdAt: LocalDate;
  receivedAt: LocalDate;
  lastProcessedAt: Date;
}

export interface AssetLinks {
  parent: LinkedAsset | null;
  children: LinkedAsset[];
  siblings: LinkedAsset[];
}

export interface AssetLinksData {
  parent: AssetId | null;
  siblings: AssetId[];
}

// Detailed data about an asset.
// These are the parts of `Asset` that were previously only part of `AssetEdit`.
// They are only visible on the asset edit page.
export interface AssetDetails {
  sgsId: number | null;
  municipality: string | null;
  processor: string | null;
  isNatRel: boolean;
  infoGeol: InfoGeol;
  usage: AssetUsages;
  statuses: WorkStatus[];
  studies: AssetStudy[];
  workgroupId: number | null;
}

export interface AssetUsages {
  public: AssetUsage;
  internal: AssetUsage;
}

export type Asset = AssetInfo & AssetDetails;

type NonDataKeys = 'processor' | 'identifiers' | 'studies' | 'statuses' | 'links' | 'lastProcessedAt' | 'files';

export interface AssetData extends Omit<Data<Asset>, NonDataKeys> {
  links: AssetLinksData;
  identifiers: (AssetIdentifier | AssetIdentifierData)[];
  statuses: (WorkStatus | WorkStatusData)[];
  studies: (AssetStudy | StudyData)[];
}

interface InfoGeol {
  main: string | null;
  contact: string | null;
  auxiliary: string | null;
}

export interface AssetIdentifier extends Model<AssetIdentifierId> {
  name: string;
  description: string;
}

export type AssetIdentifierId = number;
export type AssetIdentifierData = Data<AssetIdentifier>;

export type AssetId = number;

export interface AssetUsage {
  isAvailable: boolean;
  statusCode: UsageStatusCode;
  availableAt: LocalDate | null;
}

export enum UsageStatusCode {
  ToBeChecked = 'tobechecked',
  UnderClarification = 'underclarification',
  Approved = 'approved',
}

export interface ContactAssignment {
  contactId: number;
  role: ContactAssignmentRole;
}

export enum ContactAssignmentRole {
  Author = 'author',
  Initiator = 'initiator',
  Supplier = 'supplier',
}

export interface LinkedAsset {
  id: AssetId;
  title: string;
}

export interface WorkStatus extends Model<number> {
  itemCode: WorkStatusCode;
  createdAt: Date;
}

export type WorkStatusCode = string;
export type WorkStatusData = Data<WorkStatus>;

export interface FileReference {
  id: number;
  name: string;
  size: number;
}

export enum UsageCode {
  Public = 'public',
  Internal = 'internal',
  UseOnRequest = 'useOnRequest',
}

export interface AssetStudy extends Model<AssetStudyId> {
  geom: string;
  type: StudyType;
}

export type StudyData = Data<AssetStudy>;

export type AssetStudyId = number;

export class AssetUsageBoundary implements AssetUsage {
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

export class AssetUsagesBoundary implements AssetUsages {
  @IsObject()
  @ValidateNested()
  @Type(() => AssetUsageBoundary)
  public!: AssetUsageBoundary;

  @IsObject()
  @ValidateNested()
  @Type(() => AssetUsageBoundary)
  internal!: AssetUsageBoundary;
}

export class InfoGeolBoundary implements InfoGeol {
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

export class ContactAssignmentBoundary implements ContactAssignment {
  @IsInt()
  contactId!: number;

  @IsEnum(ContactAssignmentRole)
  role!: ContactAssignmentRole;
}

export class StudyDataBoundary implements StudyData {
  @IsInt({ message: messageNullableInt })
  @IsNullable()
  id?: number | undefined;

  @IsString()
  geom!: string;

  @IsEnum(StudyType)
  type!: StudyType;
}

export class WorkStatusBoundary implements WorkStatusData {
  @IsInt({ message: messageNullableInt })
  @IsNullable()
  id?: number | undefined;

  @IsDate()
  @Type(() => Date)
  createdAt!: Date;

  @IsString()
  itemCode!: string;
}

export class AssetIdentifierBoundary implements AssetIdentifierData {
  @IsInt({ message: messageNullableInt })
  @IsNullable()
  id?: number | undefined;

  @IsString()
  name!: string;

  @IsString()
  description!: string;
}

export class AssetLinksDataBoundary implements AssetLinksData {
  @IsInt({ message: messageNullableInt })
  @IsNullable()
  parent!: number | null;

  @IsInt({ each: true })
  siblings!: number[];
}

export class AssetDataBoundary implements AssetData {
  @IsObject()
  @ValidateNested()
  @Type(() => AssetLinksDataBoundary)
  links!: AssetLinksDataBoundary;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetIdentifierBoundary)
  identifiers!: AssetIdentifierBoundary[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkStatusBoundary)
  statuses!: WorkStatusBoundary[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudyDataBoundary)
  studies!: StudyDataBoundary[];

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
  @Type(() => ContactAssignmentBoundary)
  contactAssignments!: ContactAssignmentBoundary[];

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
  @Type(() => InfoGeolBoundary)
  infoGeol!: InfoGeolBoundary;

  @IsObject()
  @ValidateNested()
  @Type(() => AssetUsagesBoundary)
  usage!: AssetUsagesBoundary;

  @IsNumber()
  @IsNullable()
  workgroupId!: number | null;
}
