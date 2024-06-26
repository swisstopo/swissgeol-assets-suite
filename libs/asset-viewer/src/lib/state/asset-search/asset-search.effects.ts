import { Injectable, inject } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { appSharedStateActions, fromAppShared } from '@asset-sg/client-shared';
import { isDecodeError, isNotNull } from '@asset-sg/core';
import { AssetSearchQuery, AssetSearchResult, LV95, Polygon } from '@asset-sg/shared';
import * as RD from '@devexperts/remote-data-ts';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as D from 'io-ts/Decoder';
import { filter, map, merge, switchMap, tap, withLatestFrom } from 'rxjs';

import { AssetSearchService } from '../../services/asset-search.service';

import * as actions from './asset-search.actions';
import { AppStateWithAssetSearch, AssetSearchState } from './asset-search.reducer';
import { selectAssetSearchQuery, selectAssetSearchState } from './asset-search.selector';

@UntilDestroy()
@Injectable()
export class AssetSearchEffects {
  private readonly store = inject(Store<AssetSearchState>);
  private readonly actions$ = inject(Actions);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly assetSearchService = inject(AssetSearchService);
  private readonly searchStore = inject(Store<AppStateWithAssetSearch>);

  constructor() {
    merge(this.store.select(fromAppShared.selectRDReferenceData))
      .pipe(
        filter(RD.isFailure),
        map((e) => e.error),
        filter(isDecodeError)
      )
      .subscribe((e) => {
        console.error('DecodeError', D.draw(e.cause));
      });
  }

  // noinspection JSUnusedGlobalSymbols
  readSearchQueryParams$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.initializeSearch),
      concatLatestFrom(() => this.route.queryParams),
      map(([_, params]) => {
        const query: AssetSearchQuery = {};
        const assetId: number | undefined = readNumberParam(params, QUERY_PARAM_MAPPING.assetId);
        query.text = readStringParam(params, QUERY_PARAM_MAPPING.text);
        query.polygon = readPolygonParam(params, QUERY_PARAM_MAPPING.polygon);
        query.authorId = readNumberParam(params, QUERY_PARAM_MAPPING.authorId);
        const min = readDateParam(params, QUERY_PARAM_MAPPING.createDate.min);
        const max = readDateParam(params, QUERY_PARAM_MAPPING.createDate.max);
        query.createDate = min && max ? { min, max } : undefined;
        query.manCatLabelItemCodes = readArrayParam(params, QUERY_PARAM_MAPPING.manCatLabelItemCodes);
        query.assetKindItemCodes = readArrayParam(params, QUERY_PARAM_MAPPING.assetKindItemCodes);
        query.usageCodes = readArrayParam(params, QUERY_PARAM_MAPPING.usageCodes);
        query.geometryCodes = readArrayParam(params, QUERY_PARAM_MAPPING.geometryCodes);
        query.languageItemCodes = readArrayParam(params, QUERY_PARAM_MAPPING.languageItemCodes);
        return { query, assetId };
      }),
      filter(({ query }) => Object.values(query).some((value) => value !== undefined)),
      map(({ query }) => actions.searchByFilterConfiguration({ filterConfiguration: query }))
    )
  );

  getStatsOnInitialize$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.initializeSearch),
      map(() => actions.getStats())
    )
  );

  readAssetIdQueryParam$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.initializeSearch),
      concatLatestFrom(() => this.route.queryParams),
      map(([_, params]) => readNumberParam(params, QUERY_PARAM_MAPPING.assetId)),
      filter((assetId): assetId is number => assetId !== undefined),
      map((assetId) => actions.searchForAssetDetail({ assetId }))
    )
  );

  // noinspection JSUnusedGlobalSymbols
  updateQueryParams$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(actions.search),
        concatLatestFrom(() => [this.store.select(selectAssetSearchQuery), this.route.queryParams]),
        tap(([_, query, urlParams]) => {
          const params: Params = { ...urlParams };

          updatePlainParam(params, QUERY_PARAM_MAPPING.text, query.text);
          updateArrayParam(
            params,
            QUERY_PARAM_MAPPING.polygon,
            query.polygon?.map(({ x, y }) => `${x}:${y}`)
          );
          updatePlainParam(params, QUERY_PARAM_MAPPING.authorId, query.authorId);
          updateDateParam(params, QUERY_PARAM_MAPPING.createDate.min, query.createDate?.min);
          updateDateParam(params, QUERY_PARAM_MAPPING.createDate.max, query.createDate?.max);
          updateArrayParam(params, QUERY_PARAM_MAPPING.manCatLabelItemCodes, query.manCatLabelItemCodes);
          updateArrayParam(params, QUERY_PARAM_MAPPING.assetKindItemCodes, query.assetKindItemCodes);
          updateArrayParam(params, QUERY_PARAM_MAPPING.usageCodes, query.usageCodes);
          updateArrayParam(params, QUERY_PARAM_MAPPING.geometryCodes, query.geometryCodes);
          updateArrayParam(params, QUERY_PARAM_MAPPING.languageItemCodes, query.languageItemCodes);
          this.router.navigate([], {
            queryParams: params,
          });
        })
      ),
    { dispatch: false }
  );

  public updateSearchResultsAfterChangingSearchState$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actions.searchByFilterConfiguration, actions.removePolygon),
      map(() => actions.search())
    );
  });

  public updateStatsAfterRemovingPolygonOrTriggeringStartSearch$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actions.removePolygon, appSharedStateActions.triggerSearch),
      map(() => actions.getStats())
    );
  });

  public updateStatsAfterChangingFilterConfiguration$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actions.searchByFilterConfiguration),
      filter(
        ({ filterConfiguration }) => filterConfiguration.polygon !== undefined || filterConfiguration.text !== undefined
      ),
      map(() => actions.getStats())
    );
  });

  public searchForAssets$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actions.search),
      withLatestFrom(this.searchStore.select(selectAssetSearchState)),
      switchMap(([_, state]) => {
        return this.assetSearchService
          .search(state.query)
          .pipe(map((searchResults: AssetSearchResult) => actions.updateSearchResults({ searchResults })));
      })
    );
  });

  public searchForAssetDetail$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actions.searchForAssetDetail),
      switchMap(({ assetId }) => {
        return this.assetSearchService
          .loadAssetDetailData(assetId)
          .pipe(map((assetDetail) => actions.updateAssetDetail({ assetDetail })));
      })
    );
  });

  public openPanelOnSuccessfulSearch$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actions.searchByFilterConfiguration, appSharedStateActions.triggerSearch),
      map(() => appSharedStateActions.openPanel())
    );
  });

  public updateStats$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actions.getStats),
      withLatestFrom(this.searchStore.select(selectAssetSearchState)),
      switchMap(([_, state]) => {
        return this.assetSearchService
          .updateSearchResultStats({
            text: state.query.text,
            polygon: state.query.polygon,
          })
          .pipe(map((searchStats) => actions.updateStats({ searchStats })));
      })
    );
  });

  public closePanelOnResetSearch$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actions.resetSearch),
      map(() => appSharedStateActions.closePanel())
    );
  });

  public closeDetailOnUpdateSearch$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actions.search, actions.resetSearch),
      map(() => actions.resetAssetDetail())
    );
  });

  public setSearchLoadingState$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actions.searchByFilterConfiguration, actions.removePolygon),
      map(() => actions.setLoadingState())
    );
  });
}

const QUERY_PARAM_MAPPING = {
  text: 'search[text]',
  polygon: 'search[polygon]',
  authorId: 'search[author]',
  createDate: {
    min: 'search[createDate][min]',
    max: 'search[createDate][max]',
  },
  manCatLabelItemCodes: 'search[manCat]',
  assetKindItemCodes: 'search[kind]',
  usageCodes: 'search[usage]',
  geometryCodes: 'search[geometry]',
  languageItemCodes: 'search[lang]',
  assetId: 'assetId',
};

const updatePlainParam = (params: Params, name: string, value: string | number | undefined): void => {
  if (value == null) {
    delete params[name];
    return;
  }
  params[name] = value;
};

const updateDateParam = (params: Params, name: string, value: Date | undefined): void => {
  updatePlainParam(params, name, value?.toISOString());
};

const updateArrayParam = (params: Params, name: string, value: Array<string | number> | undefined): void => {
  updatePlainParam(params, name, value == null ? undefined : JSON.stringify(value));
};

const readStringParam = (params: Params, name: string): string | undefined => params[name];

const readNumberParam = (params: Params, name: string): number | undefined => {
  const stringValue = readStringParam(params, name);
  if (stringValue == null) {
    return undefined;
  }
  const value = parseFloat(stringValue);
  if (isNaN(value)) {
    return undefined;
  }
  return value;
};

const readArrayParam = <T>(params: Params, name: string): T[] | undefined => {
  const stringValue = readStringParam(params, name);
  if (stringValue == null) {
    return undefined;
  }
  return JSON.parse(stringValue);
};

const readDateParam = (params: Params, name: string): Date | undefined => {
  const stringValue = readStringParam(params, name);
  if (stringValue == null) {
    return undefined;
  }
  return new Date(stringValue);
};

const readPolygonParam = (params: Params, name: string): Polygon | undefined => {
  const arrayValue = readArrayParam<string>(params, name);
  if (arrayValue == null) {
    return undefined;
  }
  return arrayValue
    .map((it) => {
      const parts = it.split(':');
      if (parts.length !== 2) {
        return null;
      }
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      if (isNaN(x) || isNaN(y)) {
        return null;
      }
      return { x, y } as LV95;
    })
    .filter(isNotNull);
};
