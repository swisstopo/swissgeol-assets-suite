import { LocalizedItemCode } from './localized-item';

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
  alias: string;

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
  pageCount: number;

  /**
   * DB: `legal_doc_item_code`
   */
  legalDocCode: LocalizedItemCode | null;

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
  legalDocItemCode: LocalizedItemCode | null;
  file: File;
}
