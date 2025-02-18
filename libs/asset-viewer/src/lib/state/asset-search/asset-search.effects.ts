import { inject, Injectable } from '@angular/core';
import { AppState } from '@asset-sg/client-shared';
import { isNull, ORD } from '@asset-sg/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Actions, createEffect, ofType, OnInitEffects } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { filter, map, of, switchMap, take, withLatestFrom } from 'rxjs';
import { AllStudyService } from '../../services/all-study.service';
import { AssetSearchService } from '../../services/asset-search.service';

import * as actions from './asset-search.actions';
import { LoadingState } from './asset-search.reducer';
import {
  selectAssetDetailLoadingState,
  selectAssetSearchQuery,
  selectCurrentAssetDetail,
  selectIsSearchQueryEmpty,
  selectStudies,
} from './asset-search.selector';

@UntilDestroy()
@Injectable()
export class AssetSearchEffects implements OnInitEffects {
  private readonly store = inject(Store<AppState>);
  private readonly actions$ = inject(Actions);
  private readonly assetSearchService = inject(AssetSearchService);
  private readonly allStudyService = inject(AllStudyService);

  ngrxOnInitEffects(): Action {
    return actions.initialize();
  }

  public initializeAsset$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.runCombinedSearch),
      map(({ assetId }) => (assetId == null ? actions.clearSelectedAsset() : actions.selectAsset({ assetId })))
    )
  );

  public initializeQuery$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.runCombinedSearch),
      map(({ query }) => actions.search({ query }))
    )
  );

  public mergeQuery$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.mergeQuery),
      withLatestFrom(this.store.select(selectAssetSearchQuery)),
      map(([{ query: nextQuery }, currentQuery]) => {
        return actions.search({ query: { ...currentQuery, ...nextQuery } });
      })
    )
  );

  public loadSelectedAsset$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.selectAsset),
      switchMap(({ assetId }) => this.assetSearchService.fetchAssetEditDetail(assetId)),
      map((asset) => actions.setSelectedAsset({ asset }))
    )
  );

  public loadStudies$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actions.initialize),
      switchMap(() => this.store.select(selectStudies).pipe(take(1))),
      filter(isNull),
      switchMap(() => this.allStudyService.getAllStudies().pipe(ORD.fromFilteredSuccess)),
      map((studies) => actions.setStudies({ studies }))
    );
  });

  public triggerSearchExecution$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.search, actions.resetSearch, actions.clearPolygon),
      switchMap((action) => {
        if ('query' in action) {
          return of(action.query);
        }
        return this.store.select(selectAssetSearchQuery).pipe(take(1));
      }),
      map((query) => actions.executeSearch({ query }))
    )
  );

  public loadResults$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.executeSearch),
      switchMap(({ query }) => this.assetSearchService.search(query)),
      map((results) => actions.updateResults({ results }))
    )
  );

  public loadStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.executeSearch),
      switchMap(({ query }) => this.assetSearchService.searchStats(query)),
      map((stats) => actions.updateStats({ stats }))
    )
  );

  public toggleResultsTable$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.updateResults),
      map(({ results }) => results.page.total !== 0),
      withLatestFrom(this.store.select(selectIsSearchQueryEmpty)),
      map(([hasResults, isSearchQueryEmpty]) =>
        !hasResults || isSearchQueryEmpty ? actions.closeResults() : actions.openResults()
      )
    )
  );

  public handleAssetClick$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actions.assetClicked),
      withLatestFrom(this.store.select(selectCurrentAssetDetail)),
      map(([{ assetId }, currentAssetDetail]) =>
        assetId === currentAssetDetail?.assetId ? actions.clearSelectedAsset() : actions.selectAsset({ assetId })
      )
    );
  });

  public closeDetailOnUpdateSearch$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actions.search),
      withLatestFrom(this.store.select(selectAssetDetailLoadingState)),
      filter(([, loadingState]) => loadingState != LoadingState.Loading),
      map(() => actions.clearSelectedAsset())
    );
  });
}
