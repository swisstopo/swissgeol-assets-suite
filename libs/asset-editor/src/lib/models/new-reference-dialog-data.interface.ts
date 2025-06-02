import { AssetEditDetail } from '@asset-sg/shared';
import { WorkgroupId } from '@asset-sg/shared/v2';
import { AssetForm } from '../components/asset-editor-page/asset-editor-page.component';

export interface NewReferenceDialogData {
  form: AssetForm['controls']['references'];
  asset: AssetEditDetail | null;
  workgroupId: WorkgroupId | null;
}
