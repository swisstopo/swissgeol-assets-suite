import { LocalDate } from '@shared/models/base/local-date';
import { Data, Model } from '@shared/models/base/model';
import { StudyType } from '@shared/models/study';

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
  workgroupId: number;
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

export interface InfoGeol {
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
