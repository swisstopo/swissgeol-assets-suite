import { WorkflowStatus } from '@swissgeol/ui-core';
import { AssetFile, UpdateAssetFileData } from './asset-file';
import { AssetIdentifier, AssetIdentifierData } from './asset-identifier';
import { LocalDate } from './base/local-date';
import { Model } from './base/model';
import { AssetContact } from './contact';
import { CreateGeometryData, GeometryData } from './geometry';
import { LocalizedItemCode } from './localized-item';
import { LanguageCode } from './reference-data';
import { UserId } from './user';
import { WorkgroupId } from './workgroup';

export type AssetId = number;

export interface Asset extends Model<AssetId> {
  /**
   * DB: `title_public`
   */
  title: string;

  /**
   * DB: `title_original`
   */
  originalTitle: string | null;

  /**
   * DB: `is_nat_rel`
   */
  isOfNationalInterest: boolean;

  /**
   * DB: `is_public`
   */
  isPublic: boolean;

  /**
   * DB: `restriction_date`
   */
  restrictionDate: LocalDate | null;

  /**
   * Legacy data.
   *
   * Is empty when the asset has no such data.
   * Note that new assets do not get legacy data,
   * and always have this set to `null`.
   */
  legacyData: AssetLegacyData | null;

  /**
   * DB: `asset_format_item_code`
   */
  formatCode: LocalizedItemCode;

  /**
   * DB: `asset_kind_item_code`
   */
  kindCode: LocalizedItemCode;

  /**
   * DB: `asset_language` table
   */
  languageCodes: LanguageCode[];

  /**
   * DB: `type_nat_rel` table
   */
  nationalInterestTypeCodes: LocalizedItemCode[];

  /**
   * DB: `man_cat_label_ref` table
   */
  topicCodes: LocalizedItemCode[];

  /**
   * DB: `id` table
   */
  identifiers: AssetIdentifier[];

  /**
   * DB: `asset_file` table
   */
  files: AssetFile[];

  /**
   * DB: `asset_contact` table
   */
  contacts: AssetContact[];

  /**
   * DB: `asset_main_id`
   */
  parent: LinkedAsset | null;

  /**
   * DB: `asset_main_id`
   */
  children: LinkedAsset[];

  /**
   * DB: `asset_x_asset_y` table
   */
  siblings: LinkedAsset[];

  /**
   * DB: `workgroup_id`
   */
  workgroupId: WorkgroupId;

  /**
   * DB: `creator_id`
   */
  creatorId: UserId | null;

  /**
   * DB: `create_date`
   */
  createdAt: LocalDate;

  /**
   * DB: `receipt_date`
   */
  receivedAt: LocalDate;

  /**
   * DB: `workflow` table, "status" field
   */
  workflowStatus: WorkflowStatus;
}

export interface AssetLegacyData {
  /**
   * DB: `sgs_id`
   */
  sgsId: number | null;

  /**
   * DB: `geol_data_info`
   */
  data: string | null;

  /**
   * DB: `geol_contact_data_info`
   */
  contactData: string | null;

  /**
   * DB: `geol_aux_data_info`
   */
  auxiliaryData: string | null;

  /**
   * DB: `municipality`
   */
  municipality: string | null;
}

export type LinkedAsset = Pick<Asset, 'id' | 'title'>;

// TODO The following fields exist in the DB, but are not mapped into the asset model:
//      - url (always `null`)
//      - locationAnalog
//      - textBody (always `null`)
//      - remark (always `null`)
//      - author_biblio_id (always `null`)
//      - source_project (always `null`)
//      - description (always `null`)
//      - isExtract

// TODO We could consider extracting `AssetLegacyData` into its own table,
//      as all its fields will be `null` for all new assets.

// TODO There are only 2 assets with an entry in `type_nat_rel` and `is_nat_rel = FALSE`.
//      I would assume that whenever a `type_nat_rel` exists, `is_nat_rel` should be true.
//      This would enable use to remove the `is_nat_rel` field.

type OmittedDataKeys = 'id' | 'legacyData' | 'children' | 'creatorId' | 'files' | 'workflowStatus';

export type AssetData = {
  [K in keyof Omit<Asset, OmittedDataKeys>]: AssetDataValueMapping<Asset[K]>;
};

type AssetDataValueMapping<V> =
  V extends Array<infer E>
    ? Array<AssetDataValueMapping<E>>
    : V extends LinkedAsset
      ? AssetId
      : V extends AssetIdentifier
        ? AssetIdentifier | AssetIdentifierData
        : V;

export interface CreateAssetData extends AssetData {
  geometries: CreateGeometryData[];
}

export interface UpdateAssetData extends AssetData {
  geometries: GeometryData[];
  files: UpdateAssetFileData[];
}
