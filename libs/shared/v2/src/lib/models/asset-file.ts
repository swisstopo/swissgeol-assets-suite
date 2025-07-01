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
   * DB: `last_modified_at`
   */
  lastModifiedAt: Date;

  /**
   * DB: `ocr_status`
   */
  ocrStatus: OcrStatus;
}

export type AssetFileId = number;

export interface CreateAssetFileData {
  file: File;
  legalDocCode: LegalDocCode | null;
}

export interface UpdateAssetFileData {
  id: AssetFileId;
  legalDocCode: LegalDocCode | null;
}

export enum LegalDocCode {
  FederalData = 'federalData',
  PermissionForm = 'permissionForm',
  Contract = 'contract',
  Other = 'other',
}

export enum OcrStatus {
  Created = 'created',
  Waiting = 'waiting',
  Processing = 'processing',
  Success = 'success',
  Error = 'error',
  WillNotBeProcessed = 'willNotBeProcessed',
}
