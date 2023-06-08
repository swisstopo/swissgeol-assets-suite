import * as RD from '@devexperts/remote-data-ts';
import { createReducer, on } from '@ngrx/store';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';

import { ApiError, AppState } from '@asset-sg/client-shared';

import { AssetEditDetail } from '../models';

import * as actions from './asset-editor.actions';

export interface AssetEditorState {
    rdAssetEditDetail: RD.RemoteData<ApiError, O.Option<AssetEditDetail>>;
}
const initialState: AssetEditorState = {
    rdAssetEditDetail: RD.initial,
};

export interface AppStateWithAssetEditor extends AppState {
    assetEditor: AssetEditorState;
}

export const assetEditorReducer = createReducer(
    initialState,
    on(actions.loadAssetEditDetailResult, (state, rdAssetEditDetail) => ({ ...state, rdAssetEditDetail })),
    on(actions.updateAssetEditDetailResult, (state, rdAssetEditDetail) => ({
        ...state,
        rdAssetEditDetail: pipe(rdAssetEditDetail, RD.map(O.some)),
    })),
);
