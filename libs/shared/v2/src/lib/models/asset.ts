import { AssetFile } from './asset-file';
import { AssetIdentifier, AssetIdentifierData } from './asset-identifier';
import { LocalDate } from './base/local-date';
import { Model } from './base/model';
import { AssetContact } from './contact';
import { LocalizedItemCode } from './localized-item';
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
   * DB: `is_extract`
   */
  isExtract: boolean;

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
  languageCodes: LocalizedItemCode[];

  /**
   * DB: `type_nat_rel` table
   */
  nationalInterestTypes: LocalizedItemCode[];

  /**
   * DB: `man_cat_label_ref` table
   */
  topics: LocalizedItemCode[];

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
  parentId: AssetId | null;

  /**
   * DB: `asset_x_asset_y` table
   */
  siblingIds: AssetId[];

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

// TODO The following fields exist in the DB, but are not mapped into the asset model:
//      - url (always `null`)
//      - locationAnalog
//      - textBody (always `null`)
//      - remark (always `null`)
//      - author_biblio_id (always `null`)
//      - source_project (always `null`)
//      - description (always `null`)

// TODO We could consider extracting `AssetLegacyData` into its own table,
//      as all its fields will be `null` for all new assets.

// TODO Can we remove the `spatial_ref_sys` table?

// TODO There are only 2 assets with an entry in `type_nat_rel` and `is_nat_rel = FALSE`.
//      I would assume that whenever a `type_nat_rel` exists, `is_nat_rel` should be true.
//      This would enable use to remove the `is_nat_rel` field.

export interface AssetData extends Omit<Asset, 'id' | 'identifiers'> {
  identifiers: Array<AssetIdentifier | AssetIdentifierData>;
}
