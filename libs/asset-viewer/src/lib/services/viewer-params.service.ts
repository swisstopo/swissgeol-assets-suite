import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { isNotNull } from '@asset-sg/core';
import { AssetSearchQuery, LV95, Polygon } from '@asset-sg/shared';
import { AssetId } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { combineLatest, distinctUntilChanged, firstValueFrom, map, skip, Subscription } from 'rxjs';
import { runCombinedSearch } from '../state/asset-search/asset-search.actions';
import { AssetSearchState } from '../state/asset-search/asset-search.reducer';
import {
  hasNoActiveFilters,
  selectAssetSearchQuery,
  selectCurrentAssetDetail,
} from '../state/asset-search/asset-search.selector';

@Injectable({ providedIn: 'root' })
export class ViewerParamsService {
  private readonly store = inject(Store<AssetSearchState>);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private params!: ViewerParams;
  private isUpdatingUrl = false;

  private readonly paramsFromStore$ = combineLatest([
    this.store.select(selectAssetSearchQuery).pipe(distinctUntilChanged()),
    this.store.select(selectCurrentAssetDetail).pipe(distinctUntilChanged()),
  ]).pipe(map(([query, asset]) => ({ query, assetId: asset?.assetId ?? null })));

  private subscription = new Subscription();

  start(): void {
    this.initialize().then();
  }

  stop(): void {
    this.params = undefined as unknown as ViewerParams;
    this.subscription.unsubscribe();
    this.subscription = new Subscription();
  }

  private async initialize(): Promise<void> {
    const paramsFromUrl = this.parseParamsFromUrl();

    const paramsFromStore = await firstValueFrom(this.paramsFromStore$);

    // We only use the values from the store if:
    // - There are no URL query params
    // - There are query or assetId values in the store
    // - We always take the value for 'favoritesOnly' from the URL
    if (isEmptyParams(paramsFromUrl) && !isEmptyParams(paramsFromStore)) {
      this.params = paramsFromStore;
      this.params.query.favoritesOnly = paramsFromUrl.query.favoritesOnly;
      this.writeParamsToUrl({ shouldReplaceUrl: true });
      // When navigating from 'Favorites' to 'Create Asset' to 'Filter', we need to override the 'favoritesOnly' property in the state and trigger a new search
      this.writeParamsToStore();
    } else {
      this.params = paramsFromUrl;
      this.writeParamsToStore();
    }
    this.subscribe();
  }

  private subscribe(): void {
    // Whether the next query params update should replace the current url instead of adding a new navigation entry.
    // This is mainly set due to a navigation to a different path (e.g. `/de` to `/de/favorites`).
    let shouldReplaceUrl = false;

    // Write values that change in the store to the URL.
    // Note that we skip the first value as we will already have synced with it.
    this.subscription.add(
      this.paramsFromStore$.pipe(skip(1)).subscribe((params) => {
        this.params = params;
        this.writeParamsToUrl({ shouldReplaceUrl });
        shouldReplaceUrl = false;
      })
    );

    // Ensure that the params stay up-to-date when navigating.
    let lastUrl = document.location.pathname.split('?', 2)[0];
    this.subscription.add(
      this.router.events.subscribe(async (event) => {
        if (!(event instanceof NavigationEnd)) {
          return;
        }
        const url = event.url.split('?', 2)[0];
        if (this.isUpdatingUrl) {
          lastUrl = url;
          return;
        }
        if (url === lastUrl) {
          this.params = this.parseParamsFromUrl();
          this.writeParamsToStore();
        } else {
          const isFavoritesOnly = this.parseFavoritesOnlyFromUrl();
          this.params = await firstValueFrom(this.paramsFromStore$);
          this.params.query = {
            ...this.params.query,
            favoritesOnly: isFavoritesOnly,
          };
          shouldReplaceUrl = true;
          this.writeParamsToStore();
        }
        lastUrl = url;
      })
    );
  }

  private writeParamsToUrl(options: { shouldReplaceUrl?: boolean } = {}): void {
    const { query, assetId } = this.params;

    const params: Params = {};
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
    updatePlainParam(params, QUERY_PARAM_MAPPING.assetId, assetId);

    const url = document.location.pathname.split('/', 3);
    const route = query.favoritesOnly ? ['favorites'] : [];

    this.isUpdatingUrl = true;
    this.router
      .navigate([url[1], ...route], {
        queryParams: params,
        queryParamsHandling: 'merge',
        replaceUrl: options.shouldReplaceUrl,
      })
      .finally(() => {
        this.isUpdatingUrl = false;
      });
  }

  private writeParamsToStore(): void {
    this.store.dispatch(
      runCombinedSearch({
        assetId: this.params.assetId ?? undefined,
        query: this.params.query,
      })
    );
  }

  private parseParamsFromUrl(): ViewerParams {
    const { queryParams: params } = this.route.snapshot;
    const query: AssetSearchQuery = {};
    const assetId = readNumberParam(params, QUERY_PARAM_MAPPING.assetId) ?? null;
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
    query.favoritesOnly = this.parseFavoritesOnlyFromUrl();
    return { query, assetId };
  }

  private parseFavoritesOnlyFromUrl(): boolean {
    const url = document.location.pathname.split('/', 3);
    return url.length === 3 && url[2] === 'favorites';
  }
}

interface ViewerParams {
  query: AssetSearchQuery;
  assetId: AssetId | null;
}

const isEmptyParams = (params: ViewerParams): boolean => params.assetId == null && hasNoActiveFilters(params.query);

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
  categories: 'search[categories]',
};

const updatePlainParam = (params: Params, name: string, value: string | number | null | undefined): void => {
  params[name] = value == null || value === '' ? null : value;
};

const updateDateParam = (params: Params, name: string, value: Date | null | undefined): void => {
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
