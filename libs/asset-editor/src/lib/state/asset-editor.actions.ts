import { Asset, Workflow } from '@asset-sg/shared/v2';
import { createAction, props } from '@ngrx/store';

export const loadAsset = createAction('[Asset Editor] Load Asset', props<{ assetId: number }>());

export const updateAssetResult = createAction('[Asset Editor] Update Asset Result', props<{ asset: Asset }>());

export const deleteAsset = createAction('[Asset Editor] Delete asset', props<{ assetId: number }>());

export const handleSuccessfulDeletion = createAction(
  '[Asset Editor] Handle successful deletion',
  props<{
    assetId: number;
  }>(),
);

export const setWorkflow = createAction('[Asset Editor] Set Workflow', props<{ workflow: Workflow }>());

export const reset = createAction('[Asset Editor] Reset');
