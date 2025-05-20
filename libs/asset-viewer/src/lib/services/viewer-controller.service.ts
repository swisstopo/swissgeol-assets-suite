import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { appSharedStateActions } from '@asset-sg/client-shared';
import { AssetSearchQuery, isEmptySearchQuery } from '@asset-sg/shared';
import { AssetId, makeEmptyAssetSearchResults } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import {
  distinctUntilChanged,
  filter,
  firstValueFrom,
  identity,
  map,
  merge,
  Observable,
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
  selectCurrentAsset,
  selectFiltersState,
  selectIsResultsOpen,
  selectMapPosition,
  selectResultsState,
  selectScrollOffsetForResults,
  selectSearchQuery,
  selectSearchResults,
  selectStudies,
} from '../state/asset-search/asset-search.selector';
import { AllStudyService } from './all-study.service';
import { AssetSearchService } from './asset-search.service';
import { isEmptyViewerParams, ViewerParams, ViewerParamsService } from './viewer-params.service';

@Injectable({ providedIn: 'root' })
export class ViewerControllerService {
  private readonly store = inject(Store<AppStateWithAssetSearch>);
  private readonly viewerParamsService = inject(ViewerParamsService);
  private readonly assetSearchService = inject(AssetSearchService);
  private readonly allStudyService = inject(AllStudyService);
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
    loads.push(this.updateStoreByParams(params));

    const studies = await firstValueFrom(this.store.select(selectStudies));
    if (studies.length === 0) {
      loads.push(this.loadStudies());
    }
    loads.push(this.loadResults(params.query, { force: isPanelOpen(params.ui.resultsState) }));
    loads.push(this.loadStats(params.query));
    await Promise.all(loads);

    this.subscription.add(this.syncUrlParams());
    this.subscription.add(this.loadResultsWhenPanelIsOpened());
    this.subscription.add(this.reactToNavigation());
    this.subscription.add(this.store.select(selectSearchQuery).pipe(skip(1)).subscribe(this.updateByQuery.bind(this)));
    this.viewerReadySubject.next();
  }

  private async loadStudies(): Promise<void> {
    this.store.dispatch(actions.setStudies({ isLoading: true }));
    const studies = await firstValueFrom(this.allStudyService.getAllStudies());
    this.store.dispatch(actions.setStudies({ studies, isLoading: false }));
  }

  private async loadResults(query: AssetSearchQuery, options: { force?: boolean } = {}): Promise<void> {
    if (!options.force && isEmptySearchQuery(query)) {
      this.store.dispatch(actions.setResults({ results: makeEmptyAssetSearchResults(), isLoading: false }));
      return;
    }
    this.store.dispatch(actions.setResults({ isLoading: true }));
    const results = await firstValueFrom(this.assetSearchService.search(query));
    this.store.dispatch(actions.setResults({ results, isLoading: false }));
    if (results.data.length === 1) {
      await this.loadAsset(results.data[0].assetId);
    } else {
      this.store.dispatch(appSharedStateActions.setCurrentAsset({ asset: undefined, isLoading: false }));
    }
  }

  private async loadStats(query: AssetSearchQuery): Promise<void> {
    this.store.dispatch(actions.setStats({ isLoading: true }));
    const stats = await firstValueFrom(this.assetSearchService.searchStats(query));
    this.store.dispatch(actions.setStats({ stats, isLoading: false }));
  }

  private async loadAsset(id: AssetId | null): Promise<void> {
    if (id === null) {
      this.store.dispatch(appSharedStateActions.setCurrentAsset({ asset: null }));
      return;
    }
    this.store.dispatch(appSharedStateActions.setCurrentAsset({ isLoading: true }));
    const asset = await firstValueFrom(this.assetSearchService.fetchAssetEditDetail(id));
    this.store.dispatch(appSharedStateActions.setCurrentAsset({ asset, isLoading: false }));
  }

  private async updateByQuery(query: AssetSearchQuery): Promise<void> {
    if (isEmptySearchQuery(query)) {
      this.store.dispatch(actions.setMapPosition({ position: DEFAULT_MAP_POSITION }));
    }
    await Promise.all([this.loadResults(query), this.loadStats(query)]);
    const results = await firstValueFrom(this.store.select(selectSearchResults));
    this.store.dispatch(
      actions.setResultsState({
        state: results.page.total === 0 ? PanelState.ClosedAutomatically : PanelState.OpenedAutomatically,
      }),
    );
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
      this.store.select(selectCurrentAsset),
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
