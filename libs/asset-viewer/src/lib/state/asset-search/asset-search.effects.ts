import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AppState, assetsPageMatcher, fromAppShared } from '@asset-sg/client-shared';
import { deepEqual, isDecodeError, isNotNull, ORD } from '@asset-sg/core';
import { AssetSearchQuery, AssetSearchResult, LV95, Polygon } from '@asset-sg/shared';
import * as RD from '@devexperts/remote-data-ts';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { ROUTER_NAVIGATED } from '@ngrx/router-store';
import { Store } from '@ngrx/store';
import * as D from 'io-ts/Decoder';
import { EMPTY, filter, map, merge, of, share, switchMap, takeUntil, withLatestFrom } from 'rxjs';

import { AllStudyService } from '../../services/all-study.service';
import { AssetSearchService } from '../../services/asset-search.service';

import * as actions from './asset-search.actions';
import {
  selectAssetSearchQuery,
  selectCurrentAssetDetail,
  selectAssetSearchNoActiveFilters,
  selectStudies,
  selectAssetSearchResultData,
} from './asset-search.selector';

@UntilDestroy()
@Injectable()
export class AssetSearchEffects {
  private readonly store = inject(Store<AppState>);
  private readonly actions$ = inject(Actions);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly assetSearchService = inject(AssetSearchService);
  private readonly allStudyService = inject(AllStudyService);

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

  public loadSearch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.search, actions.resetSearch, actions.removePolygon),
      withLatestFrom(this.store.select(selectAssetSearchQuery)),
      map(([_, query]) => actions.loadSearch({ query }))
    )
  );

  public assetResults$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.loadSearch),
      switchMap(({ query }) =>
        this.assetSearchService
          .search(query)
          .pipe(map((searchResults: AssetSearchResult) => actions.updateSearchResults({ searchResults })))
      )
    )
  );

  public assetStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.loadSearch),
      switchMap(({ query }) =>
        this.assetSearchService
          .updateSearchResultStats(query)
          .pipe(map((searchStats) => actions.updateStats({ searchStats })))
      )
    )
  );

  public toggleAssetDetail$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actions.assetClicked),
      withLatestFrom(this.store.select(selectCurrentAssetDetail)),
      switchMap(([{ assetId }, currentAssetDetail]) =>
        assetId !== currentAssetDetail?.assetId
          ? this.assetSearchService
              .loadAssetDetailData(assetId)
              .pipe(map((assetDetail) => actions.updateAssetDetail({ assetDetail })))
          : of(actions.resetAssetDetail())
      )
    );
  });

  public showAssetDetail$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actions.showAssetDetail),
      withLatestFrom(this.store.select(selectCurrentAssetDetail)),
      switchMap(([{ assetId }, currentAssetDetail]) =>
        assetId !== currentAssetDetail?.assetId
          ? this.assetSearchService
              .loadAssetDetailData(assetId)
              .pipe(map((assetDetail) => actions.updateAssetDetail({ assetDetail })))
          : EMPTY
      )
    );
  });

  public closeDetailOnUpdateSearch$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actions.search),
      map(() => actions.resetAssetDetail())
    );
  });

  public openSearchResults$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actions.updateSearchResults),
      takeUntil(this.actions$.pipe(ofType(actions.manualToggleResult))),
      withLatestFrom(this.store.select(selectAssetSearchNoActiveFilters)),
      map(([_, showStudies]) => (showStudies ? actions.closeResults() : actions.openResults()))
    );
  });

  public closeSearchResults$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actions.updateSearchResults),
      withLatestFrom(this.store.select(selectAssetSearchNoActiveFilters)),
      filter(([_, showStudies]) => showStudies),
      map(() => actions.closeResults())
    );
  });

  public loadStudies$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actions.initializeSearch),
      switchMap(() => this.store.select(selectStudies)),
      filter((x) => !x),
      switchMap(() => this.allStudyService.getAllStudies().pipe(ORD.fromFilteredSuccess)),
      map((studies) => actions.setStudies({ studies }))
    );
  });

  /**
   * Query Parameter Interactions
   */
  public queryParams$ = this.actions$.pipe(
    ofType(ROUTER_NAVIGATED),
    filter((x) => assetsPageMatcher(x.payload.routerState.root.firstChild.url) !== null),
    map(({ payload }) => {
      const params = payload.routerState.root.queryParams;
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
      query.workgroupIds = readArrayParam<number>(params, QUERY_PARAM_MAPPING.workgroupIds);
      return { query, assetId };
    }),
    share()
  );

  public readSearchQueryParams$ = createEffect(() =>
    this.queryParams$.pipe(
      withLatestFrom(
        this.store.select(selectAssetSearchQuery),
        this.store.select(selectAssetSearchResultData).pipe(map((r) => r.length > 0))
      ),
      filter(([params, storeQuery]) => !deepEqual(params.query, storeQuery)),
      map(([params, storeQuery, searchResultsLoaded]) => {
        const paramsEmpty = Object.values(params.query).every((v) => v == null);
        if (paramsEmpty) {
          if (searchResultsLoaded) {
            return actions.updateQueryParams();
          } else {
            return actions.loadSearch({ query: storeQuery });
          }
        } else {
          return actions.search({ query: params.query });
        }
      })
    )
  );

  public readAssetIdQueryParam$ = createEffect(() =>
    this.queryParams$.pipe(
      withLatestFrom(this.store.select(selectCurrentAssetDetail)),
      filter(([params, storeAssetDetail]) => params.assetId !== storeAssetDetail?.assetId),
      map(([params, storeAssetDetail]) => {
        const paramsEmpty = Object.values(params.query).every((v) => v == null);
        const assetId = paramsEmpty ? storeAssetDetail?.assetId : params.assetId;
        return assetId === undefined ? actions.resetAssetDetail() : actions.showAssetDetail({ assetId });
      })
    )
  );

  public updateQueryParams$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(actions.updateQueryParams, actions.loadSearch, actions.updateAssetDetail, actions.resetAssetDetail),
        concatLatestFrom(() => [
          this.store.select(selectAssetSearchQuery),
          this.store.select(selectCurrentAssetDetail),
        ]),
        switchMap(([_, query, assetDetail]) => {
          const params: Params = { assetId: assetDetail?.assetId };
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
          updateArrayParam(params, QUERY_PARAM_MAPPING.workgroupIds, query.workgroupIds);
          return this.router.navigate([], { queryParams: params });
        })
      ),
    { dispatch: false }
  );
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
  workgroupIds: 'search[workgroup]',
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
