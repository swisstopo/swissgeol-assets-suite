import { ApiError } from '@asset-sg/client-shared';
import { ContactEdit, PatchAsset, PatchContact } from '@asset-sg/shared';
import * as RD from '@devexperts/remote-data-ts';
import { createAction, props } from '@ngrx/store';
import * as O from 'fp-ts/Option';

import { AssetEditorNewFile } from '../components/asset-editor-form-group';
import { AssetEditDetail } from '../models';

export const loadAssetEditDetailResult = createAction(
  '[Asset Editor] Load Asset Edit Detail Result',
  props<RD.RemoteData<ApiError, O.Option<AssetEditDetail>>>()
);

export const createNewAsset = createAction('[Asset Editor] Create new asset', props<{ patchAsset: PatchAsset }>());

export const updateAssetEditDetail = createAction(
  '[Asset Editor] Update asset',
  props<{ assetId: number; patchAsset: PatchAsset; filesToDelete: number[]; newFiles: AssetEditorNewFile[] }>()
);

export const updateAssetEditDetailResult = createAction(
  '[Asset Editor] Update Asset Edit Detail Result',
  props<RD.RemoteData<ApiError, AssetEditDetail>>()
);

export const deleteAsset = createAction('[Asset Editor] Delete asset', props<{ assetId: number }>());

export const handleSuccessfulDeletion = createAction('[Asset Editor] Handle successful deletion');
export const editContact = createAction('[Asset Editor] Edit contact', props<{ contact: ContactEdit }>());

export const createContact = createAction('[Asset Editor] Create contact', props<{ contact: PatchContact }>());
