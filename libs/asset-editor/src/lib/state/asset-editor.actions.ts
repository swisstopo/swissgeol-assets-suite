import { Asset, GeometryDetail, Workflow } from '@asset-sg/shared/v2';
import { createAction, props } from '@ngrx/store';

export const loadAsset = createAction('[Asset Editor] Load Asset', props<{ assetId: number }>());

export const updateAsset = createAction(
  '[Asset Editor] Update Asset',
  props<{ asset: Asset; geometries: GeometryDetail[] }>(),
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
