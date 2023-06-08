import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import * as RD from '@devexperts/remote-data-ts';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { pipe } from 'fp-ts/function';
import { Eq as NumberEq } from 'fp-ts/number';
import * as O from 'fp-ts/Option';
import { Eq as StringEq } from 'fp-ts/string';
import * as D from 'io-ts/Decoder';
import * as MO from 'monocle-ts/Optional';
import {
    Observable,
    concat,
    concatMap,
    distinctUntilChanged,
    filter,
    map,
    merge,
    partition,
    shareReplay,
    switchMap,
    take,
    withLatestFrom,
} from 'rxjs';
import { Overwrite } from 'type-zoo';

import { appSharedStateActions, filterNavigateToComponent, fromAppShared } from '@asset-sg/client-shared';
import { GetTypeOfObservable, OO, isDecodeError, isEmpty, partitionEither } from '@asset-sg/core';
import { LV95, eqLV95Array } from '@asset-sg/shared';

import { AssetViewerPageComponent } from '../components/asset-viewer-page/asset-viewer-page.component';
import {
    BaseClientAssetSearchRefinement,
    ClientAssetQueryParams,
    ClientAssetSearchParams,
    ClientAssetSearchParamsLeaderPolygon,
    ClientAssetSearchParamsLeaderText,
    ClientAssetSearchRefinement,
    EqClientAssetSearchParams,
    emptyClientAssetSearchPolygonRefinement,
    emptyClientAssetSearchTextRefinement,
    updateBaseRefinement,
} from '../models';
import { AssetSearchService } from '../services/asset-search.service';

import * as actions from './asset-viewer.actions';
import { AppStateWithAssetViewer } from './asset-viewer.reducer';
import * as fromAssetViewer from './asset-viewer.selectors';

@UntilDestroy()
@Injectable()
export class AssetSearchEffects {
    constructor(
        private actions$: Actions,
        private assetSearchService: AssetSearchService,
        private store: Store<AppStateWithAssetViewer>,
        private router: Router,
    ) {
        merge(
            this.store.select(fromAppShared.selectRDReferenceData),
            this.store.select(fromAssetViewer.selectRDSearchAssets),
        )
            .pipe(
                filter(RD.isFailure),
                map(e => e.error),
                filter(isDecodeError),
            )
            .subscribe(e => {
                console.error('DecodeError', D.draw(e.cause));
            });
    }

    assetSearchParamsFromSearchText$ = this.actions$.pipe(
        ofType(actions.searchByText),
        withLatestFrom(this.store.select(fromAssetViewer.selectClientAssetQueryParams)),
        map(([action, clientAssetQueryParams]) =>
            makeClientAssetQueryParamsFromSearchText(action.text, clientAssetQueryParams),
        ),
    );

    assetSearchParamsFromPolygon$ = this.actions$.pipe(
        ofType(actions.searchByPolygon),
        withLatestFrom(this.store.select(fromAssetViewer.selectClientAssetSearchParams)),
        // xhere
        map(([action, clientAssetSearchParams]) =>
            makeAssetSearchQueryParamsFromPolygon(action.polygon, clientAssetSearchParams),
        ),
    );

    assetSearchParamsFromRemovePolygon$ = this.actions$.pipe(
        ofType(actions.removePolygon),
        withLatestFrom(this.store.select(fromAssetViewer.selectClientAssetQueryParams)),
        map(([, clientAssetQueryParams]) => makeAssetSearchQueryParamsFromRemovePolygon(clientAssetQueryParams)),
    );

    assetSearchClear$ = this.actions$.pipe(
        ofType(actions.clearSearchText),
        withLatestFrom(this.store.select(fromAssetViewer.selectClientAssetSearchParams)),
        map(([, clientAssetSearchParams]) =>
            pipe(
                clientAssetSearchParams,
                O.chain(params =>
                    pipe(
                        ClientAssetSearchParams.matchStrict<O.Option<ClientAssetSearchParams>>({
                            text: () => O.none,
                            polygon: a =>
                                O.some({
                                    ...a,
                                    refinement: pipe(
                                        a.refinement,
                                        O.map(r => ({ ...r, searchText: O.none })),
                                    ),
                                }),
                        })(params),
                        O.map(searchParams => ({ searchParams, assetId: O.none as O.Option<number> })),
                    ),
                ),
            ),
        ),
    );

    assetSearchRefine$ = this.actions$.pipe(
        ofType(actions.refine),
        withLatestFrom(this.store.select(fromAssetViewer.selectClientAssetSearchParams)),
        map(([action, clientAssetSearchParams]) =>
            pipe(
                makeAssetSearchQueryParamsFromBasicRefinement(action.refinement, clientAssetSearchParams),
                O.map(searchParams => ({ searchParams, assetId: O.none as O.Option<number> })),
            ),
        ),
    );

    navigateForMainSearch$ = createEffect(() =>
        merge(
            this.assetSearchParamsFromSearchText$,
            this.assetSearchParamsFromPolygon$,
            this.assetSearchParamsFromRemovePolygon$,
            this.assetSearchRefine$,
            this.assetSearchClear$,
        ).pipe(
            switchMap(qp => {
                const queryParams = pipe(
                    qp,
                    O.map(q =>
                        ClientAssetQueryParams.encode({
                            v: '1',
                            searchParams: O.some(q.searchParams),
                            assetId: q.assetId,
                        }),
                    ),
                    O.toUndefined,
                );
                return this.router.navigate([], { queryParams });
            }),
            switchMap(() => [appSharedStateActions.openPanel(), actions.openRefineAndResults()]),
        ),
    );

    queryParamtersWithEmptyCheck = partition(
        filterNavigateToComponent(this.actions$, AssetViewerPageComponent).pipe(map(({ queryParams }) => queryParams)),
        isEmpty,
    );
    emptyQueryParams$ = this.queryParamtersWithEmptyCheck[0];
    notEmptyQueryParams$ = this.queryParamtersWithEmptyCheck[1];

    validatedAssetSearchQueryParams = partitionEither(
        this.notEmptyQueryParams$.pipe(
            map(pipe(ClientAssetQueryParams.decode)),
            shareReplay({ bufferSize: 1, refCount: true }),
        ),
    );
    validAssetSearchQueryParams$ = this.validatedAssetSearchQueryParams[1].pipe(
        withLatestFrom(this.store.select(fromAssetViewer.selectClientAssetSearchParams)),
        filter(([e, current]) => !O.getEq(EqClientAssetSearchParams).equals(e.searchParams, current)),
        map(([e]) => e),
    );

    navigateForInvalidAssetSearchQueryParams$ = createEffect(
        () =>
            this.validatedAssetSearchQueryParams[0].pipe(
                concatMap(e => {
                    console.error('error decoding queryParams', D.draw(e));
                    return this.router.navigate(['/'], { queryParams: undefined });
                }),
            ),
        { dispatch: false },
    );

    /*
     * Partition the validAssetSearchQueryParams$ based on whether the searchParams is Some or None
     * - If the searchParams is None, then that's one of the triggers for simply updating the store without making an API request.
     * - If the searchParams is Some, then we may need to make an API request
     */
    partitionedOnIfSearchParamsIsSome = partition(
        this.validAssetSearchQueryParams$,
        (a): a is Overwrite<ClientAssetQueryParams, { searchParams: O.Some<ClientAssetSearchParams> }> =>
            O.isSome(a.searchParams),
    );
    searchParamsIsSome$ = this.partitionedOnIfSearchParamsIsSome[0].pipe(
        map(a => ({ ...a, searchParams: a.searchParams.value })),
    );
    searchParamsIsNone$ = this.partitionedOnIfSearchParamsIsSome[1];

    dispatchResetSearch$ = createEffect(() =>
        merge(this.emptyQueryParams$, this.searchParamsIsNone$.pipe(map(() => O.none))).pipe(
            switchMap(() => [actions.resetSearch(), appSharedStateActions.closePanel()]),
        ),
    );

    withRequestType$ = this.searchParamsIsSome$.pipe(
        switchMap(clientAssetQueryParams =>
            ClientAssetSearchParams.matchStrict<Observable<SearchParamsWithRequestType>>({
                text: makeSearchTextRequestType(this.store),
                polygon: makeSearchPolygonRequestType(this.store),
            })(clientAssetQueryParams.searchParams).pipe(
                map(searchParamsWithRequestType => ({
                    clientAssetQueryParams,
                    searchParamsWithRequestType,
                })),
            ),
        ),
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    dispatchRefinementWithNoApiRequest$ = createEffect(() =>
        this.withRequestType$.pipe(
            filter(a => a.searchParamsWithRequestType.noRequest),
            map(a => a.searchParamsWithRequestType.searchParams),
            map(
                ClientAssetSearchParams.matchStrict<O.Option<ClientAssetSearchRefinement>>({
                    text: t => pipe(t.refinement, O.map(ClientAssetSearchRefinement.of.text)),
                    polygon: p => pipe(p.refinement, O.map(ClientAssetSearchRefinement.of.polygon)),
                }),
            ),
            map(refinement => actions.sendRefinementToStore({ refinement })),
        ),
    );

    loadSearchResults$ = createEffect(() =>
        this.withRequestType$.pipe(
            filter(a => !a.searchParamsWithRequestType.noRequest),
            switchMap(a => {
                switch (a.searchParamsWithRequestType.requestType) {
                    case 'SEARCH_TEXT': {
                        return this.assetSearchService
                            .search(a.searchParamsWithRequestType.searchParams.searchText)
                            .pipe(map(rdSearchResult => ({ ...a, rdSearchResult, action: actions.searchResults })));
                    }
                    case 'SEARCH_POLYGON':
                        return this.searchPolygon(a, a.searchParamsWithRequestType.searchParams.searchPolygon);
                    case 'SEARCH_TEXT_BASED_ON_POLYGON':
                        return this.searchTextBasedOnPolygon(
                            a,
                            a.searchParamsWithRequestType.searchParams.searchPolygon,
                            a.searchParamsWithRequestType.searchText,
                        );
                    case 'SEARCH_TEXT_AFTER_POLYGON':
                        return concat(
                            this.searchPolygon(a, a.searchParamsWithRequestType.searchParams.searchPolygon),
                            this.searchTextBasedOnPolygon(
                                a,
                                a.searchParamsWithRequestType.searchParams.searchPolygon,
                                a.searchParamsWithRequestType.searchText,
                            ),
                        );
                }
            }),
            switchMap(({ action, rdSearchResult, clientAssetQueryParams }) => [
                appSharedStateActions.openPanel(),
                action({
                    clientAssetQueryParams: {
                        ...clientAssetQueryParams,
                        searchParams: O.some(clientAssetQueryParams.searchParams),
                    },
                    rdSearchResult,
                }),
            ]),
        ),
    );

    searchPolygon = (a: QueryParamsWithRequestType, polygon: Array<LV95>) =>
        this.assetSearchService
            .searchByPolygon(polygon)
            .pipe(map(rdSearchResult => ({ ...a, rdSearchResult, action: actions.searchResults })));

    searchTextBasedOnPolygon = (a: QueryParamsWithRequestType, polygon: Array<LV95>, searchText: string) =>
        this.assetSearchService.searchByPolygonRefineBySearchText(polygon, searchText).pipe(
            map(rdSearchResult => ({
                ...a,
                rdSearchResult,
                action: actions.refinePolygonSearchResult,
            })),
        );

    loadAssetDetail$ = createEffect(() =>
        this.validatedAssetSearchQueryParams[1].pipe(
            map(({ assetId }) => assetId),
            distinctUntilChanged(O.getEq(NumberEq).equals),
            OO.fromFilteredSome,
            switchMap(assetId => this.assetSearchService.loadAssetDetailData(assetId)),
            map(actions.loadAssetDetailResult),
        ),
    );

    clearAssetDetail$ = createEffect(() =>
        merge(
            this.emptyQueryParams$,
            this.validatedAssetSearchQueryParams[1].pipe(
                map(({ assetId }) => assetId),
                filter(O.isNone),
            ),
        ).pipe(map(actions.clearAssetDetail)),
    );
}

const makeClientAssetQueryParamsFromSearchText = (
    searchText: string,
    existingClientAssetQueryParams: O.Option<ClientAssetQueryParams>,
): O.Option<{ searchParams: ClientAssetSearchParams; assetId: O.Option<number> }> =>
    pipe(
        existingClientAssetQueryParams,
        O.bindTo('queryParams'),
        O.bind('searchParams', ({ queryParams }) => queryParams.searchParams),
        O.map(bag =>
            ClientAssetSearchParams.match({
                polygon: p => ({
                    searchParams: ClientAssetSearchParams.of.polygon({
                        ...p,
                        refinement: pipe(
                            p.refinement,
                            O.alt(() => O.some(emptyClientAssetSearchPolygonRefinement)),
                            O.map(r => ({ ...r, searchText: O.some(searchText) })),
                        ),
                    }),
                    assetId: pipe(
                        p.refinement,
                        O.chain(r => r.searchText),
                        O.filter(s => s === searchText),
                        O.chain(() => bag.queryParams.assetId),
                    ),
                }),
                text: t => ({
                    searchParams: ClientAssetSearchParams.of.text({ searchText, refinement: O.none }),
                    assetId: pipe(
                        bag.queryParams.assetId,
                        O.filter(() => t.searchText === searchText),
                    ),
                }),
            })(bag.searchParams),
        ),
        O.alt(() =>
            O.some({
                searchParams: ClientAssetSearchParams.of.text({ searchText, refinement: O.none }),
                assetId: O.none as O.Option<number>,
            }),
        ),
    );

const makeAssetSearchQueryParamsFromPolygon = (
    polygon: Array<LV95>,
    existingClientAssetSearchParams: O.Option<ClientAssetSearchParams>,
): O.Option<{ searchParams: ClientAssetSearchParams; assetId: O.Option<number> }> =>
    pipe(
        existingClientAssetSearchParams,
        O.filter(ClientAssetSearchParams.is.text),
        O.map(leaderTextSearchParams => ({
            searchParams: ClientAssetSearchParams.of.text({
                ...leaderTextSearchParams,
                refinement: pipe(
                    leaderTextSearchParams.refinement,
                    O.alt(() => O.some(emptyClientAssetSearchTextRefinement)),
                    O.map(r => ({ ...r, polygon: O.some(polygon) })),
                ),
            }),
            assetId: O.none,
        })),
        O.alt(() =>
            O.some({
                searchParams: ClientAssetSearchParams.of.polygon({ searchPolygon: polygon, refinement: O.none }),
                assetId: O.none,
            }),
        ),
    );

const makeAssetSearchQueryParamsFromRemovePolygon = (
    existingClientAssetQueryParams: O.Option<ClientAssetQueryParams>,
): O.Option<{ searchParams: ClientAssetSearchParams; assetId: O.Option<number> }> =>
    pipe(
        existingClientAssetQueryParams,
        O.chain(a => a.searchParams),
        O.filter(ClientAssetSearchParams.is.text),
        O.map(leaderTextSearchParams => ({
            searchParams: ClientAssetSearchParams.of.text({
                ...leaderTextSearchParams,
                refinement: pipe(
                    leaderTextSearchParams.refinement,
                    O.alt(() => O.some(emptyClientAssetSearchTextRefinement)),
                    O.map(r => ({ ...r, polygon: O.none })),
                ),
            }),
            assetId: pipe(
                existingClientAssetQueryParams,
                O.chain(a => a.assetId),
            ),
        })),
    );

const makeAssetSearchQueryParamsFromBasicRefinement = (
    refinement: O.Option<BaseClientAssetSearchRefinement>,
    existingClientAssetSearchParams: O.Option<ClientAssetSearchParams>,
): O.Option<ClientAssetSearchParams> =>
    pipe(existingClientAssetSearchParams, O.chain(updateBaseRefinement(refinement)));

const makeSearchTextRequestType =
    (store: Store<AppStateWithAssetViewer>) => (searchParams: ClientAssetSearchParamsLeaderText) =>
        store.select(fromAssetViewer.selectSearchParamsLeaderTextSearchFields).pipe(
            take(1),
            map(storeSearchText => {
                const noRequest = O.getEq(StringEq).equals(O.some(searchParams.searchText), storeSearchText);
                return {
                    requestType: 'SEARCH_TEXT' as const,
                    noRequest,
                    searchParams,
                };
            }),
        );
type SearchTextRequestType = GetTypeOfObservable<ReturnType<ReturnType<typeof makeSearchTextRequestType>>>;

const makeSearchPolygonRequestType =
    (store: Store<AppStateWithAssetViewer>) => (searchParams: ClientAssetSearchParamsLeaderPolygon) =>
        store.select(fromAssetViewer.selectSearchParamsLeaderPolygonSearchFields).pipe(
            take(1),
            map(fields => {
                const fieldsLens = pipe(MO.id<typeof fields>(), MO.some);
                const storeSearchPolygon = pipe(fieldsLens, MO.prop('polygon')).getOption(fields);
                const storeSearchText = pipe(fieldsLens, MO.prop('searchText'), MO.some).getOption(fields);

                const searchText = pipe(
                    searchParams.refinement,
                    O.chain(a => a.searchText),
                );

                const isPolygonEqual = O.getEq(eqLV95Array).equals(
                    O.some(searchParams.searchPolygon),
                    storeSearchPolygon,
                );
                const isSearchTextEqual = O.getEq(StringEq).equals(searchText, storeSearchText);
                const isSearchTextPresentAndNotEqual = O.isSome(searchText) && !isSearchTextEqual;

                if (isSearchTextPresentAndNotEqual && !isPolygonEqual) {
                    return {
                        requestType: 'SEARCH_TEXT_AFTER_POLYGON' as const,
                        noRequest: false,
                        searchParams,
                        searchText: searchText.value,
                    };
                }
                if (isSearchTextPresentAndNotEqual && isPolygonEqual) {
                    return {
                        requestType: 'SEARCH_TEXT_BASED_ON_POLYGON' as const,
                        noRequest: false,
                        searchParams,
                        searchText: searchText.value,
                    };
                }
                return {
                    requestType: 'SEARCH_POLYGON' as const,
                    noRequest: isPolygonEqual,
                    searchParams,
                };
            }),
        );

type SearchPolygonRequestType = GetTypeOfObservable<ReturnType<ReturnType<typeof makeSearchPolygonRequestType>>>;

type SearchParamsWithRequestType = SearchTextRequestType | SearchPolygonRequestType;

interface QueryParamsWithRequestType extends GetTypeOfObservable<AssetSearchEffects['withRequestType$']> {}
