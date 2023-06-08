import * as RD from '@devexperts/remote-data-ts';
import { createAction, props } from '@ngrx/store';
import * as O from 'fp-ts/Option';

import { ApiError } from '@asset-sg/client-shared';
import { LV95 } from '@asset-sg/shared';

import {
    AssetDetail,
    BaseClientAssetSearchRefinement,
    ClientAssetQueryParams,
    ClientAssetSearchRefinement,
    SearchAssetResultClient,
} from '../models';

export const resetSearch = createAction('[Asset Viewer] Reset Search');
export const searchByText = createAction('[Asset Viewer] Search by text', props<{ text: string }>());
export const clearSearchText = createAction('[Asset Viewer] Clear search text');
export const searchByPolygon = createAction('[Asset Viewer] Search by polygon', props<{ polygon: Array<LV95> }>());
export const removePolygon = createAction('[Asset Viewer] Remove polygon');

export type RDSearchResults = RD.RemoteData<ApiError, SearchAssetResultClient>;
export interface SearchResultsProps {
    clientAssetQueryParams: ClientAssetQueryParams;
    rdSearchResult: RDSearchResults;
}

export const searchResults = createAction('[Asset Viewer] SearchResults', props<SearchResultsProps>());

export const refine = createAction(
    '[Asset Viewer] Refine',
    props<{ refinement: O.Option<BaseClientAssetSearchRefinement> }>(),
);

export const sendRefinementToStore = createAction(
    '[Asset Viewer] Send refinement to store',
    props<{ refinement: O.Option<ClientAssetSearchRefinement> }>(),
);

export const refinePolygonSearchResult = createAction(
    '[Asset Viewer] Search by polygon result',
    props<SearchResultsProps>(),
);

export const mapInitialised = createAction('[Asset Viewer] Map Initialised');

export const loadAssetDetailResult = createAction(
    '[Asset Viewer] Load Asset Detail Result',
    props<RD.RemoteData<ApiError, AssetDetail>>(),
);
export const clearAssetDetail = createAction('[Asset Viewer] Clear Asset Detail');

export const openRefineAndResults = createAction('[Asset Viewer] Open Refine and Results');
export const closeRefineAndResults = createAction('[Asset Viewer] Close Refine and Results');
