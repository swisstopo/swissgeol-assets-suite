import { createSelector } from '@ngrx/store';

import { AppStateWithAssetEditor } from './asset-editor.reducer';

const assetEditorFeature = (state: AppStateWithAssetEditor) => state.assetEditor;

export const selectAssetEditDetail = createSelector(assetEditorFeature, (state) => state.assetEditDetail);
