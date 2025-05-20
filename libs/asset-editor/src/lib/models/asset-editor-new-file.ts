import { AssetFileType, LegalDocItemCode } from '@asset-sg/shared';

export interface AssetEditorNewFile {
  type: AssetFileType;
  legalDocItemCode: LegalDocItemCode | null;
  file: File;
}
