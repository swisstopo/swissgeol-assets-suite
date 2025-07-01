import { inject, Injectable } from '@angular/core';
import { Params, Router } from '@angular/router';
import { AppSharedState } from '@asset-sg/client-shared';
import { isNotNull } from '@asset-sg/core';
import { LV95 } from '@asset-sg/shared';
import { AssetId, AssetSearchQuery, isEmptySearchQuery, LocalDate, Polygon } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { firstValueFrom, map } from 'rxjs';
import { DEFAULT_MAP_POSITION } from '../components/map/map-controller';

import { isPanelOpen, PanelState } from '../state/asset-search/asset-search.actions';
import {
  AppStateWithAssetSearch,
  AssetSearchState,
  AssetSearchUiState,
} from '../state/asset-search/asset-search.reducer';

@Injectable({ providedIn: 'root' })
export class ViewerParamsService {
  private readonly router = inject(Router);
  private readonly store = inject(Store<AppStateWithAssetSearch>);

  async readParamsFromStore(): Promise<ViewerParams> {
    const [searchState, sharedState] = await firstValueFrom(
      this.store.pipe(map((store) => [store.assetSearch, store.shared] as [AssetSearchState, AppSharedState])),
    );

    return {
      assetId: sharedState.currentAsset?.asset.id ?? null,
      query: searchState.query,
      ui: searchState.ui,
    };
  }

  async readParamsFromUrl(): Promise<ViewerParams> {
    const { queryParams: params } = this.router.routerState.snapshot.root;
    const query: AssetSearchQuery = {};
    const assetId = readNumberParam(params, QUERY_PARAM_MAPPING.assetId) ?? null;
    query.text = readStringParam(params, QUERY_PARAM_MAPPING.text);
    query.polygon = readPolygonParam(params, QUERY_PARAM_MAPPING.polygon);
    query.authorId = readNumberParam(params, QUERY_PARAM_MAPPING.authorId);
    const min = readDateParam(params, QUERY_PARAM_MAPPING.createdAt.min);
    const max = readDateParam(params, QUERY_PARAM_MAPPING.createdAt.max);
    query.createdAt = min && max ? { min: LocalDate.fromDate(min), max: LocalDate.fromDate(max) } : undefined;
    query.topicCodes = readArrayParam(params, QUERY_PARAM_MAPPING.topicCodes);
    query.kindCodes = readArrayParam(params, QUERY_PARAM_MAPPING.kindCodes);
    query.usageCodes = readArrayParam(params, QUERY_PARAM_MAPPING.usageCodes);
    query.geometryTypes = readArrayParam(params, QUERY_PARAM_MAPPING.geometryTypes);
    query.languageCodes = readArrayParam(params, QUERY_PARAM_MAPPING.languageCodes);
    query.workgroupIds = readArrayParam<number>(params, QUERY_PARAM_MAPPING.workgroupIds);
    query.favoritesOnly = this.parseFavoritesOnlyFromUrl();
    const ui: AssetSearchUiState = {
      filtersState:
        (readBooleanParam(params, UI_PARAM_MAPPING.filtersState) ?? true)
          ? PanelState.OpenedAutomatically
          : PanelState.ClosedAutomatically,
      resultsState:
        (readBooleanParam(params, UI_PARAM_MAPPING.resultsState) ?? false)
          ? PanelState.OpenedAutomatically
          : PanelState.ClosedAutomatically,
      scrollOffsetForResults: readNumberParam(params, UI_PARAM_MAPPING.scrollOffsetForResults) ?? 0,
      map: {
        x: readNumberParam(params, UI_PARAM_MAPPING.map.x) ?? DEFAULT_MAP_POSITION.x,
        y: readNumberParam(params, UI_PARAM_MAPPING.map.y) ?? DEFAULT_MAP_POSITION.y,
        z: readNumberParam(params, UI_PARAM_MAPPING.map.z) ?? DEFAULT_MAP_POSITION.z,
      },
    };
    return { query, ui, assetId };
  }

  async writeParamsToUrl(viewerParams: ViewerParams, options: { shouldReplaceUrl?: boolean } = {}): Promise<void> {
    const { query, ui, assetId } = viewerParams;

    const params: Params = {};
    updatePlainParam(params, QUERY_PARAM_MAPPING.text, query.text);
    updateArrayParam(
      params,
      QUERY_PARAM_MAPPING.polygon,
      query.polygon?.map(({ x, y }) => `${x}:${y}`),
    );
    updatePlainParam(params, QUERY_PARAM_MAPPING.authorId, query.authorId);
    updateDateParam(params, QUERY_PARAM_MAPPING.createdAt.min, query.createdAt?.min?.toDate());
    updateDateParam(params, QUERY_PARAM_MAPPING.createdAt.max, query.createdAt?.max?.toDate());
    updateArrayParam(params, QUERY_PARAM_MAPPING.topicCodes, query.topicCodes);
    updateArrayParam(params, QUERY_PARAM_MAPPING.kindCodes, query.kindCodes);
    updateArrayParam(params, QUERY_PARAM_MAPPING.usageCodes, query.usageCodes);
    updateArrayParam(params, QUERY_PARAM_MAPPING.geometryTypes, query.geometryTypes);
    updateArrayParam(params, QUERY_PARAM_MAPPING.languageCodes, query.languageCodes);
    updateArrayParam(params, QUERY_PARAM_MAPPING.workgroupIds, query.workgroupIds);
    updatePlainParam(params, QUERY_PARAM_MAPPING.assetId, assetId);

    updatePlainParam(params, UI_PARAM_MAPPING.scrollOffsetForResults, ui.scrollOffsetForResults, { defaultValue: 0 });
    updatePlainParam(params, UI_PARAM_MAPPING.filtersState, isPanelOpen(ui.filtersState), { defaultValue: true });
    updatePlainParam(params, UI_PARAM_MAPPING.resultsState, isPanelOpen(ui.resultsState), { defaultValue: false });

    updatePlainParam(params, UI_PARAM_MAPPING.map.x, ui.map.x, { defaultValue: DEFAULT_MAP_POSITION.x });
    updatePlainParam(params, UI_PARAM_MAPPING.map.y, ui.map.y, { defaultValue: DEFAULT_MAP_POSITION.y });
    updatePlainParam(params, UI_PARAM_MAPPING.map.z, ui.map.z, { defaultValue: DEFAULT_MAP_POSITION.z });

    const url = document.location.pathname.split('/', 3);
    const route = query.favoritesOnly ? ['favorites'] : [];

    await this.router.navigate([url[1], ...route], {
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl: options.shouldReplaceUrl,
    });
  }

  private parseFavoritesOnlyFromUrl(): boolean {
    const url = document.location.pathname.split('/', 3);
    return url.length === 3 && url[2] === 'favorites';
  }
}

export const isEmptyViewerParams = (params: ViewerParams): boolean =>
  params.assetId == null && isEmptySearchQuery(params.query);

export interface ViewerParams {
  query: AssetSearchQuery;
  ui: AssetSearchUiState;
  assetId: AssetId | null;
}

const QUERY_PARAM_MAPPING = {
  text: 'search[text]',
  polygon: 'search[polygon]',
  authorId: 'search[author]',
  createdAt: {
    min: 'search[createDate][min]',
    max: 'search[createDate][max]',
  },
  topicCodes: 'search[manCat]',
  kindCodes: 'search[kind]',
  usageCodes: 'search[usage]',
  geometryTypes: 'search[geometry]',
  languageCodes: 'search[lang]',
  assetId: 'assetId',
  workgroupIds: 'search[workgroup]',
  categories: 'search[categories]',
};

type ParamMapping<T> = {
  [K in keyof T]: T[K] extends Record<string, any> ? ParamMapping<Required<T[K]>> : string;
};

const UI_PARAM_MAPPING: ParamMapping<AssetSearchUiState> = {
  scrollOffsetForResults: 'results[offset]',
  resultsState: 'results[show]',
  filtersState: 'search[show]',
  map: {
    x: 'map[x]',
    y: 'map[y]',
    z: 'map[z]',
  },
};

const updatePlainParam = <T extends string | number | boolean>(
  params: Params,
  name: string,
  value: T | null | undefined,
  options: { defaultValue?: T } = {},
): void => {
  params[name] = value == null || value === '' || value === options.defaultValue ? null : value;
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

const readBooleanParam = (params: Params, name: string): boolean | undefined => {
  const stringValue = readStringParam(params, name);
  if (stringValue == null) {
    return undefined;
  }
  return stringValue !== 'false';
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
