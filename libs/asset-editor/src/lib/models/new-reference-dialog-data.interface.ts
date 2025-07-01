import { Asset, WorkgroupId } from '@asset-sg/shared/v2';
import { AssetForm } from '../components/asset-editor-page/asset-editor-page.component';

export interface NewReferenceDialogData {
  form: AssetForm['controls']['references'];
  asset: Asset | null;
  workgroupId: WorkgroupId | null;
}
