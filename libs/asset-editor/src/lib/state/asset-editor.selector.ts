import { createSelector } from '@ngrx/store';
import { AppStateWithEditor } from './asset-editor.reducer';

const assetEditorFeature = (state: AppStateWithEditor) => state.editor;

export const selectWorkflow = createSelector(assetEditorFeature, (state) => state.workflow);
