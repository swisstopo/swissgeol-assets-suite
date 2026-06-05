import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { appSharedStateActions, fromAppShared } from '@asset-sg/client-shared';
import {
  AssetId,
  AssetSearchStats,
  isEmptySearchQuery,
  makeEmptyAssetSearchResults,
  SearchQueries,
  SearchType,
} from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import {
  distinctUntilChanged,
  filter,
  firstValueFrom,
  identity,
  map,
  merge,
  Observable,
  pairwise,
  ReplaySubject,
  skip,
  Subscription,
  take,
} from 'rxjs';
import { DEFAULT_MAP_POSITION } from '../components/map/map-controller';
import * as actions from '../state/asset-search/asset-search.actions';
import {
  isPanelAutomaticallyToggled,
  isPanelOpen,
  PanelState,
  setFiltersState,
  setMapPosition,
  setQuery,
  setResultsState,
  setScrollOffsetForResults,
} from '../state/asset-search/asset-search.actions';
import { AppStateWithAssetSearch } from '../state/asset-search/asset-search.reducer';
import {
  selectFileSearchResults,
  selectFiltersState,
  selectGeometries,
  selectIsResultsOpen,
  selectMapPosition,
  selectResultsState,
  selectScrollOffsetForResults,
  selectSearchQuery,
  selectSearchResults,
} from '../state/asset-search/asset-search.selector';
import { AssetSearchService } from './asset-search.service';
import { GeometryService } from './geometry.service';
import { areViewerParamsEqual, isEmptyViewerParams, ViewerParams, ViewerParamsService } from './viewer-params.service';

@Injectable({ providedIn: 'root' })
export class ViewerControllerService {
  private readonly store = inject(Store<AppStateWithAssetSearch>);
  private readonly viewerParamsService = inject(ViewerParamsService);
  private readonly assetSearchService = inject(AssetSearchService);
  private readonly geometryService = inject(GeometryService);
  private readonly router = inject(Router);

  private viewerReadySubject = new ReplaySubject<void>(1);
  private isUpdatingUrl = false;
  private isUpdatingStore = false;

  private subscription = new Subscription();

  /**
   * Emits once when the viewer is ready, e.g. all data has been loaded and no more initial loads are taking place.
   * Subscribing to the observable after the initial emission will emit immediately, once.
   */
  get viewerReady$(): Observable<void> {
    return this.viewerReadySubject.pipe(take(1));
  }

  initialize(): void {
    this.initializeFromStore().then();
  }

  reset(): void {
    this.subscription.unsubscribe();
    this.subscription = new Subscription();
    this.viewerReadySubject = new ReplaySubject(1);
    this.isUpdatingUrl = false;
    this.isUpdatingStore = false;
  }

  selectAsset(id: AssetId): void {
    this.loadAsset(id).then();
  }

  private async initializeFromStore(): Promise<void> {
    const loads: Array<Promise<void>> = [];

    const paramsFromUrl = await this.viewerParamsService.readParamsFromUrl();
    const paramsFromStore = await this.viewerParamsService.readParamsFromStore();

    let params: ViewerParams;
    if (isEmptyViewerParams(paramsFromUrl) && !isEmptyViewerParams(paramsFromStore)) {
      params = paramsFromStore;

      // `favoritesOnly` is always taken from the URL.
      // Without this, navigating to any of the viewer pages may have the wrong value set for that filter,
      // as it fully depends on the current page's path.
      params = { ...params, query: { ...params.query, favoritesOnly: paramsFromUrl.query.favoritesOnly } };
      await this.viewerParamsService.writeParamsToUrl(params);
      loads.push(this.loadAsset(params.assetId));
    } else {
      params = paramsFromUrl;
    }

    // Preserve the results panel state if it was manually toggled by the user
    if (!isPanelAutomaticallyToggled(paramsFromStore.ui.resultsState)) {
      params = { ...params, ui: { ...params.ui, resultsState: paramsFromStore.ui.resultsState } };
    }

    loads.push(this.updateStoreByParams(params));

    const geometries = await firstValueFrom(this.store.select(selectGeometries));
    if (geometries.length === 0) {
      loads.push(this.loadGeometries(params.query.type));
    }
    loads.push(
      this.loadResults(params.query, {
        force: isPanelOpen(params.ui.resultsState),
        skipAssetReset: params.assetId !== null,
      }),
    );
    loads.push(this.loadStats(params.query));
    await Promise.all(loads);

    this.subscription.add(this.syncUrlParams());
    this.subscription.add(this.loadResultsWhenPanelIsOpened());
    this.subscription.add(this.reactToNavigation());
    this.subscription.add(
      this.store
        .select(selectSearchQuery)
        .pipe(pairwise())
        .subscribe(async ([previousQuery, currentQuery]) => await this.updateByQuery(currentQuery, previousQuery)),
    );
    this.viewerReadySubject.next();
  }

  private async loadGeometries(type: SearchType): Promise<void> {
    this.store.dispatch(actions.setGeometries({ isLoading: true }));
    const geometries = await firstValueFrom(this.geometryService.fetchAll(type));
    this.store.dispatch(actions.setGeometries({ geometries, isLoading: false }));
  }

  private async loadResults(
    query: SearchQueries,
    options: { force?: boolean; skipAssetReset?: boolean } = {},
  ): Promise<void> {
    // Always load results when favoritesOnly is true, even if other search criteria are empty
    if (!options.force && isEmptySearchQuery(query) && !query.favoritesOnly) {
      this.store.dispatch(
        actions.setAssetsAndFileResults({ results: makeEmptyAssetSearchResults(), isLoading: false }),
      );
      return;
    }

    switch (query.type) {
      case SearchType.Asset: {
        this.store.dispatch(actions.setAssetsResults({ isLoading: true }));
        const results = await firstValueFrom(this.assetSearchService.search(query));
        this.store.dispatch(actions.setAssetsResults({ results, isLoading: false }));
        if (results.data.length === 1) {
          await this.loadAsset(results.data[0].id);
        } else if (!options.skipAssetReset) {
          this.store.dispatch(appSharedStateActions.setCurrentAsset({ asset: null, isLoading: false }));
        }
        break;
      }
      case SearchType.File: {
        this.store.dispatch(actions.setFileResults({ isLoading: true }));
        this.store.dispatch(actions.setAssetsResults({ isLoading: true }));
        const fileResults = await firstValueFrom(this.assetSearchService.searchFiles(query));
        this.store.dispatch(actions.setFileResults({ fileResults, isLoading: false }));

        // Use the asset data embedded in the file search response for map rendering.
        const results = {
          page: { offset: 0, size: fileResults.assets.length, total: fileResults.assets.length },
          data: fileResults.assets,
        };
        this.store.dispatch(actions.setAssetsResults({ results, isLoading: false }));
        break;
      }
      default:
        console.warn(`Unsupported search type: ${query}`);
    }
  }

  private async loadStats(query: SearchQueries): Promise<void> {
    this.store.dispatch(actions.setStats({ isLoading: true }));
    let stats: AssetSearchStats | undefined;

    switch (query.type) {
      case SearchType.Asset:
        stats = await firstValueFrom(this.assetSearchService.searchStats(query));
        break;
      case SearchType.File:
        stats = await firstValueFrom(this.assetSearchService.searchFileStats(query));
        break;
      default:
        console.warn(`Unsupported search type: ${query}`);
    }

    if (stats) {
      this.store.dispatch(actions.setStats({ stats, isLoading: false }));
    }
  }

  private async loadAsset(id: AssetId | null): Promise<void> {
    if (id === null) {
      this.store.dispatch(appSharedStateActions.setCurrentAsset({ asset: null }));
      return;
    }
    this.store.dispatch(appSharedStateActions.setCurrentAsset({ isLoading: true }));
    const [asset, geometries] = await Promise.all([
      firstValueFrom(this.assetSearchService.fetchAsset(id)),
      firstValueFrom(this.assetSearchService.fetchGeometries(id)),
    ]);
    this.store.dispatch(appSharedStateActions.setCurrentAsset({ asset: { asset, geometries }, isLoading: false }));
  }

  private async updateByQuery(query: SearchQueries, previousQuery?: SearchQueries): Promise<void> {
    if (!previousQuery) {
      return;
    }
    const currentResultsState = await firstValueFrom(this.store.select(selectResultsState));
    const isSearchQueryEmpty = isEmptySearchQuery(query);
    if (isSearchQueryEmpty && !query.favoritesOnly) {
      // Only reset map position if the query is empty and not in favorites mode
      this.store.dispatch(actions.setMapPosition({ position: DEFAULT_MAP_POSITION }));
    }

    // Load results and stats in parallel, plus geometries if search type changed
    await Promise.all([
      this.loadResults(query, {
        force: !isPanelAutomaticallyToggled(currentResultsState) && isPanelOpen(currentResultsState),
      }),
      this.loadStats(query),
      ...(previousQuery?.type !== query.type ? [this.loadGeometries(query.type)] : []),
    ]);

    // Use file results total for file search, asset results total for asset search.
    const total =
      query.type === SearchType.File
        ? (await firstValueFrom(this.store.select(selectFileSearchResults))).page.total
        : (await firstValueFrom(this.store.select(selectSearchResults))).page.total;

    if (isSearchQueryEmpty) {
      // If the query is empty, we ALWAYS close the results
      this.store.dispatch(
        actions.setResultsState({
          state: PanelState.ClosedAutomatically,
        }),
      );
    } else if (isPanelAutomaticallyToggled(currentResultsState)) {
      this.store.dispatch(
        actions.setResultsState({
          state: total === 0 ? PanelState.ClosedAutomatically : PanelState.OpenedAutomatically,
        }),
      );
    }
  }

  private syncUrlParams(): Subscription {
    const prepareEvent = <T>(
      event$: Observable<T>,
      shouldReplaceUrl: boolean | ((value: T) => boolean),
    ): Observable<boolean> => {
      const transform = typeof shouldReplaceUrl === 'boolean' ? () => shouldReplaceUrl : shouldReplaceUrl;
      return event$.pipe(skip(1), distinctUntilChanged(), map(transform));
    };

    // Events that add a new history entry.
    const foregroundEvents: Array<Observable<unknown>> = [
      this.store.select(selectSearchQuery),
      this.store.select(fromAppShared.selectCurrentAsset),
      this.store.select(selectFiltersState),
      this.store.select(selectResultsState),
    ];

    // Events that replace the current history entry.
    const backgroundEvents: Array<Observable<unknown>> = [
      this.store.select(selectScrollOffsetForResults),
      this.store.select(selectMapPosition),
    ];

    // Events that may or may not replace the current history entry, depending on their contents.
    const dynamicEvents: Array<Observable<boolean>> = [
      prepareEvent(this.store.select(selectFiltersState), isPanelAutomaticallyToggled),
      prepareEvent(this.store.select(selectResultsState), isPanelAutomaticallyToggled),
    ];

    const foreground$ = merge(...foregroundEvents.map((event$) => prepareEvent(event$, false)));
    const background$ = merge(...backgroundEvents.map((event$) => prepareEvent(event$, true)));
    const dynamic$ = merge(...dynamicEvents);

    return merge(foreground$, background$, dynamic$).subscribe(async (shouldReplaceUrl) => {
      if (this.isUpdatingStore) {
        return;
      }
      const params = await this.viewerParamsService.readParamsFromStore();
      this.isUpdatingUrl = true;
      await this.viewerParamsService.writeParamsToUrl(params, { shouldReplaceUrl });
      this.isUpdatingUrl = false;
    });
  }

  private loadResultsWhenPanelIsOpened(): Subscription {
    return this.store
      .select(selectIsResultsOpen)
      .pipe(skip(1), filter(identity))
      .subscribe(async () => {
        const query = await firstValueFrom(this.store.select(selectSearchQuery));
        const results = await firstValueFrom(this.store.select(selectSearchResults));
        if (isEmptySearchQuery(query) && results.page.total === 0) {
          await this.loadResults(query, { force: true });
        }
      });
  }

  private reactToNavigation(): Subscription {
    return this.router.events.subscribe(async (event) => {
      if (this.isUpdatingUrl || !(event instanceof NavigationEnd)) {
        return;
      }
      const params = await this.viewerParamsService.readParamsFromUrl();

      // Preserve the results panel state if it was manually toggled by the user
      const currentResultsState = await firstValueFrom(this.store.select(selectResultsState));
      if (!isPanelAutomaticallyToggled(currentResultsState)) {
        params.ui.resultsState = currentResultsState;
      }

      const currentParams = await this.viewerParamsService.readParamsFromStore();
      if (areViewerParamsEqual(params, currentParams)) {
        return;
      }
      this.isUpdatingStore = true;
      await this.updateStoreByParams(params);
      this.isUpdatingStore = false;
    });
  }

  private updateStoreByParams(params: ViewerParams): Promise<void> {
    const { ui, query, assetId } = params;
    this.store.dispatch(setScrollOffsetForResults({ offset: ui.scrollOffsetForResults }));
    this.store.dispatch(setFiltersState({ state: ui.filtersState }));
    this.store.dispatch(setResultsState({ state: ui.resultsState }));
    this.store.dispatch(setMapPosition({ position: ui.map }));
    this.store.dispatch(setQuery({ query }));
    return this.loadAsset(assetId);
  }
}
