import { AssetEditDetail, PatchAsset } from '@asset-sg/shared';
import { Workflow } from '@asset-sg/shared/v2';
import { createAction, props } from '@ngrx/store';

import { AssetEditorNewFile } from '../models/asset-editor-new-file';

export const loadAsset = createAction('[Asset Editor] Load asset', props<{ assetId: number }>());

export const createNewAsset = createAction('[Asset Editor] Create new asset', props<{ patchAsset: PatchAsset }>());

export const updateAssetEditDetail = createAction(
  '[Asset Editor] Update asset',
  props<{ assetId: number; patchAsset: PatchAsset; filesToDelete: number[]; newFiles: AssetEditorNewFile[] }>(),
);

export const updateAssetEditDetailResult = createAction(
  '[Asset Editor] Update Asset Edit Detail Result',
  props<{
    asset: AssetEditDetail;
  }>(),
);

export const deleteAsset = createAction('[Asset Editor] Delete asset', props<{ assetId: number }>());

export const handleSuccessfulDeletion = createAction(
  '[Asset Editor] Handle successful deletion',
  props<{
    assetId: number;
  }>(),
);

export const loadWorkflow = createAction('[Asset Editor] Load Workflow', props<{ assetId: number }>());

export const setWorkflow = createAction('[Asset Editor] Set Workflow', props<{ workflow: Workflow }>());

export const reset = createAction('[Asset Editor] Reset');
