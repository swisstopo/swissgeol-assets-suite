import { AssetEditDetail } from '@asset-sg/shared';
import { AssetForm } from '../components/asset-editor-page/asset-editor-page.component';

export interface NewReferenceDialogData {
  form: AssetForm['controls']['references'];
  asset: AssetEditDetail | null;
  hasWorkgroupId: boolean;
}
