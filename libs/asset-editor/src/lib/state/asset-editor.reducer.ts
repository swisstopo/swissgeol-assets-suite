import { AppState } from '@asset-sg/client-shared';
import { createReducer, on } from '@ngrx/store';

import { AssetEditDetail } from '../models';

import * as actions from './asset-editor.actions';

export interface AssetEditorState {
  assetEditDetail?: AssetEditDetail;
}

const initialState: AssetEditorState = {
  assetEditDetail: undefined,
};

export interface AppStateWithAssetEditor extends AppState {
  assetEditor: AssetEditorState;
}

export const assetEditorReducer = createReducer(
  initialState,
  on(actions.setAsset, (state, { asset: assetEditDetail }) => ({ ...state, assetEditDetail }))
);
