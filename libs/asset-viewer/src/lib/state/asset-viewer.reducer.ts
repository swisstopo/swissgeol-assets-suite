import * as RD from '@devexperts/remote-data-ts';
import { createReducer, on } from '@ngrx/store';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';

import { ApiError, AppState, appSharedStateActions } from '@asset-sg/client-shared';

import {
    AssetDetail,
    ClientAssetQueryParams,
    ClientAssetSearchRefinement,
    SearchAssetResultClient,
    updateRefinement,
} from '../models';

import * as actions from './asset-viewer.actions';

export interface AssetViewerState {
    mapInitialised: boolean;
    rdSearchResult: RD.RemoteData<ApiError, SearchAssetResultClient>;
    rdRefinePolygonSearchResult: RD.RemoteData<ApiError, SearchAssetResultClient>;
    rdCurrentAssetDetail: RD.RemoteData<ApiError, AssetDetail>;
    clientAssetQueryParams: O.Option<ClientAssetQueryParams>;
    isRefineAndResultsOpen: boolean;
}

export interface AppStateWithAssetViewer extends AppState {
    assetViewer: AssetViewerState;
}

const initialState: AssetViewerState = {
    mapInitialised: false,
    rdSearchResult: RD.initial,
    rdCurrentAssetDetail: RD.initial,
    rdRefinePolygonSearchResult: RD.initial,
    clientAssetQueryParams: O.none,
    isRefineAndResultsOpen: false,
};

export const assetViewerReducer = createReducer(
    initialState,
    on(
        actions.resetSearch,
        (state): AssetViewerState => ({
            ...state,
            rdSearchResult: RD.initial,
            rdRefinePolygonSearchResult: RD.initial,
            clientAssetQueryParams: O.none,
        }),
    ),
    on(actions.searchResults, (state, { clientAssetQueryParams, rdSearchResult }): AssetViewerState => {
        return {
            ...state,
            rdSearchResult,
            clientAssetQueryParams: O.some(clientAssetQueryParams),
            rdRefinePolygonSearchResult: RD.initial,
            isRefineAndResultsOpen: !RD.isInitial(rdSearchResult),
        };
    }),
    on(
        actions.refinePolygonSearchResult,
        (state, { clientAssetQueryParams, rdSearchResult }): AssetViewerState => ({
            ...state,
            rdRefinePolygonSearchResult: rdSearchResult,
            clientAssetQueryParams: O.some(clientAssetQueryParams),
        }),
    ),
    on(
        actions.sendRefinementToStore,
        (state, { refinement }): AssetViewerState => ({
            ...state,
            clientAssetQueryParams: pipe(
                state.clientAssetQueryParams,
                O.map(params => ({
                    ...params,
                    searchParams: pipe(params.searchParams, O.chain(updateRefinement(refinement))),
                })),
            ),
            rdRefinePolygonSearchResult: pipe(
                refinement,
                O.filter(ClientAssetSearchRefinement.is.polygon),
                O.filter(r => O.isNone(r.searchText)),
                O.map(() => RD.initial),
                O.getOrElse(() => state.rdRefinePolygonSearchResult),
            ),
        }),
    ),
    on(actions.mapInitialised, (state): AssetViewerState => ({ ...state, mapInitialised: true })),
    on(
        actions.loadAssetDetailResult,
        (state, rdCurrentAssetDetail): AssetViewerState => ({
            ...state,
            rdCurrentAssetDetail,
            clientAssetQueryParams: pipe(
                rdCurrentAssetDetail,
                RD.toOption,
                O.chain(assetDetail =>
                    pipe(
                        state.clientAssetQueryParams,
                        O.map(params => ({ ...params, assetId: O.some(assetDetail.assetId) })),
                    ),
                ),
                O.altW(() => state.clientAssetQueryParams),
            ),
        }),
    ),
    on(
        actions.clearAssetDetail,
        (state): AssetViewerState => ({
            ...state,
            rdCurrentAssetDetail: RD.initial,
            clientAssetQueryParams: pipe(
                state.clientAssetQueryParams,
                O.map(params => ({ ...params, assetId: O.none })),
            ),
        }),
    ),
    on(appSharedStateActions.openPanel, (state): AssetViewerState => ({ ...state, isRefineAndResultsOpen: true })),
    on(actions.openRefineAndResults, (state): AssetViewerState => ({ ...state, isRefineAndResultsOpen: true })),
    on(actions.closeRefineAndResults, (state): AssetViewerState => ({ ...state, isRefineAndResultsOpen: false })),
);
