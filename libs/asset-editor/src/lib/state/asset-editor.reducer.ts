import { AppState } from '@asset-sg/client-shared';
import { Workflow } from '@asset-sg/shared/v2';
import { createReducer, on } from '@ngrx/store';
import * as actions from './asset-editor.actions';

export interface AssetEditorState {
  workflow: Workflow | null;
}

export interface AppStateWithEditor extends AppState {
  editor: AssetEditorState;
}

const initialState: AssetEditorState = {
  workflow: null,
};

export const assetEditorReducer = createReducer(
  initialState,
  on(actions.setWorkflow, (state, { workflow }) => ({
    ...state,
    workflow,
  })),
  on(actions.reset, () => initialState),
);
