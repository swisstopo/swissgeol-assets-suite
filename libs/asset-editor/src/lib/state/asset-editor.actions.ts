import { ContactEdit, PatchAsset, PatchContact } from '@asset-sg/shared';
import { createAction, props } from '@ngrx/store';

import { AssetEditorNewFile } from '../components/asset-editor-form-group';
import { AssetEditDetail } from '../models';

export const loadAsset = createAction('[Asset Editor] Load asset', props<{ assetId: number }>());
export const setAsset = createAction('[Asset Editor] Set asset', props<{ asset: AssetEditDetail }>());

export const createNewAsset = createAction('[Asset Editor] Create new asset', props<{ patchAsset: PatchAsset }>());

export const updateAssetEditDetail = createAction(
  '[Asset Editor] Update asset',
  props<{ assetId: number; patchAsset: PatchAsset; filesToDelete: number[]; newFiles: AssetEditorNewFile[] }>()
);

export const updateAssetEditDetailResult = createAction(
  '[Asset Editor] Update Asset Edit Detail Result',
  props<{
    asset: AssetEditDetail;
  }>()
);

export const deleteAsset = createAction('[Asset Editor] Delete asset', props<{ assetId: number }>());

export const handleSuccessfulDeletion = createAction(
  '[Asset Editor] Handle successful deletion',
  props<{
    assetId: number;
  }>()
);
export const editContact = createAction('[Asset Editor] Edit contact', props<{ contact: ContactEdit }>());

export const createContact = createAction('[Asset Editor] Create contact', props<{ contact: PatchContact }>());
