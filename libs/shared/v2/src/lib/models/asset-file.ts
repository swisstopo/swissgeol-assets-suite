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
   * DB: `file_processing_stage`
   */
  fileProcessingStage: FileProcessingStage | null;

  /**
   * DB: `file_processing_state`
   */
  fileProcessingState: FileProcessingState;

  /**
   * DB: `page_classifications`
   */
  pageClassifications: PageClassification[] | null;
}

export const SupportedPageLanguages = ['de', 'fr', 'it', 'en'] as const;

export type SupportedPageLanguage = (typeof SupportedPageLanguages)[number];

export enum PageCategory {
  Text = 't',
  Boreprofile = 'b',
  Map = 'm',
  GeoProfile = 'gp',
  TitlePage = 'tp',
  Diagram = 'd',
  Table = 'tbl',
  Unknown = 'u',
}

export interface PageClassification {
  from: number;
  to: number;
  languages: SupportedPageLanguage[];
  categories: PageCategory[];
}

export type AssetFileId = number;

export interface CreateAssetFileData {
  file: File;
  legalDocCode: LegalDocCode | null;
}

export interface UpdateAssetFileData {
  id: AssetFileId;
  legalDocCode: LegalDocCode | null;
  pageClassifications: PageClassification[] | null;
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

export enum FileProcessingStage {
  Ocr = 'Ocr',
  Extraction = 'Extraction',
}

export enum FileProcessingState {
  Waiting = 'Waiting',
  Processing = 'Processing',
  Success = 'Success',
  Error = 'Error',
  WillNotBeProcessed = 'WillNotBeProcessed',
}
