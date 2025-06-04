import { LocalDate } from './base/local-date';
import { Data, Model } from './base/model';
import { StudyType } from './study';

// `usageCode` will need to be determined in the frontend - it is no longer included here.
// See `makeUsageCode`.

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
  isNatRel: boolean;
  infoGeol: InfoGeol;
  studies: AssetStudy[];
  workgroupId: number;
  isPublic: boolean;
}

export interface AssetUsages {
  public: AssetUsage;
  internal: AssetUsage;
}

export type Asset = AssetInfo & AssetDetails;

type NonDataKeys = 'identifiers' | 'studies' | 'statuses' | 'links' | 'files';

export interface AssetData extends Omit<Data<Asset>, NonDataKeys> {
  links: AssetLinksData;
  identifiers: (AssetIdentifier | AssetIdentifierData)[];
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

export interface AssetStudy extends Model<AssetStudyId> {
  geom: string;
  type: StudyType;
}

export type StudyData = Data<AssetStudy>;

export type AssetStudyId = number;
