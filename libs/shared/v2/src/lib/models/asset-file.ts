/**
 * DB: `asset_file`
 */
export interface AssetFile {
  /**
   * DB: `id`
   */
  id: AssetFileId;

  /**
   * DB: `file_name`
   */
  name: string;

  /**
   * DB: `file_name_alias`
   */
  alias: string | null;

  /**
   * DB: `type`
   */
  type: AssetFileType;

  /**
   * DB: `size`
   */
  size: number;

  /**
   * DB: `page_count`
   */
  pageCount: number | null;

  /**
   * DB: `legal_doc_item_code`
   */
  legalDocCode: LegalDocCode | null;

  /**
   * DB: `page_count`
   */
  lastModifiedAt: Date;
}

export enum AssetFileType {
  Normal = 'Normal',
  Legal = 'Legal',
}

export type AssetFileId = number;

export interface AssetFileData {
  type: AssetFileType;
  legalDocCode: LegalDocCode | null;
  file: File;
}

export enum LegalDocCode {
  FederalData = 'federalData',
  PermissionForm = 'permissionForm',
  Contract = 'contract',
  Other = 'other',
}
