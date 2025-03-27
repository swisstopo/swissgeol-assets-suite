import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AssetSearchQuery, isEmptySearchQuery, makeEmptyAssetSearchResults } from '@asset-sg/shared';
import { AssetId } from '@asset-sg/shared/v2';
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
  setCurrentAsset,
  setFiltersOpen,
  setMapPosition,
  setQuery,
  setResultsOpen,
  setScrollOffsetForResults,
} from '../state/asset-search/asset-search.actions';
import { AppStateWithAssetSearch, AssetSearchState } from '../state/asset-search/asset-search.reducer';
import {
  selectCurrentAsset,
  selectIsFiltersOpen,
  selectIsResultsOpen,
  selectMapPosition,
  selectScrollOffsetForResults,
  selectSearchQuery,
  selectSearchResults,
  selectStudies,
} from '../state/asset-search/asset-search.selector';
import { AllStudyService } from './all-study.service';
import { AssetSearchService } from './asset-search.service';
import { ViewerParams, ViewerParamsService } from './viewer-params.service';

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
    const params = this.viewerParamsService.readParamsFromUrl();
    const loads: Array<Promise<void>> = [this.updateStoreByParams(params)];

    const studies = await firstValueFrom(this.store.select(selectStudies));
    if (studies.length === 0) {
      loads.push(this.loadStudies());
    }
    loads.push(this.loadResults(params.query, { force: params.ui.isResultsOpen }));
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
  }

  private async loadStats(query: AssetSearchQuery): Promise<void> {
    this.store.dispatch(actions.setStats({ isLoading: true }));
    const stats = await firstValueFrom(this.assetSearchService.searchStats(query));
    this.store.dispatch(actions.setStats({ stats, isLoading: false }));
  }

  private async loadAsset(id: AssetId): Promise<void> {
    this.store.dispatch(actions.setCurrentAsset({ isLoading: true }));
    const asset = await firstValueFrom(this.assetSearchService.fetchAssetEditDetail(id));
    this.store.dispatch(actions.setCurrentAsset({ asset, isLoading: false }));
  }

  private async updateByQuery(query: AssetSearchQuery): Promise<void> {
    if (isEmptySearchQuery(query)) {
      this.store.dispatch(actions.setMapPosition({ position: DEFAULT_MAP_POSITION }));
    }
    await Promise.all([this.loadResults(query), this.loadStats(query)]);
    const results = await firstValueFrom(this.store.select(selectSearchResults));
    this.store.dispatch(actions.setResultsOpen({ isOpen: results.page.total !== 0 }));
  }

  private syncUrlParams(): Subscription {
    const foregroundEvents = [
      this.store.select(selectSearchQuery),
      this.store.select(selectCurrentAsset),
      this.store.select(selectIsFiltersOpen),
      this.store.select(selectIsResultsOpen),
    ];

    const backgroundEvents = [this.store.select(selectScrollOffsetForResults), this.store.select(selectMapPosition)];

    const prepareEvent = (event$: Observable<unknown>, shouldReplaceUrl: boolean): Observable<boolean> => {
      return event$.pipe(
        skip(1),
        distinctUntilChanged(),
        map(() => shouldReplaceUrl)
      );
    };

    const loadParamsFromStore = async (): Promise<ViewerParams> => {
      const state = await firstValueFrom(
        this.store.pipe(map((store) => store.assetSearch)) as Observable<AssetSearchState>
      );
      return {
        assetId: state.currentAsset?.assetId ?? null,
        query: state.query,
        ui: state.ui,
      };
    };

    const foreground$ = merge(...foregroundEvents.map((event$) => prepareEvent(event$, false)));
    const background$ = merge(...backgroundEvents.map((event$) => prepareEvent(event$, true)));

    return merge(foreground$, background$).subscribe(async (shouldReplaceUrl) => {
      if (this.isUpdatingStore) {
        return;
      }
      const params = await loadParamsFromStore();
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
      const params = this.viewerParamsService.readParamsFromUrl();
      this.isUpdatingStore = true;
      await this.updateStoreByParams(params);
      this.isUpdatingStore = false;
    });
  }

  private updateStoreByParams(params: ViewerParams): Promise<void> {
    const { ui, query, assetId } = params;
    this.store.dispatch(setScrollOffsetForResults({ offset: ui.scrollOffsetForResults }));
    this.store.dispatch(setFiltersOpen({ isOpen: ui.isFiltersOpen }));
    this.store.dispatch(setResultsOpen({ isOpen: ui.isResultsOpen }));
    this.store.dispatch(setMapPosition({ position: ui.map }));
    this.store.dispatch(setQuery({ query }));

    if (assetId === null) {
      this.store.dispatch(setCurrentAsset({ asset: null }));
      return Promise.resolve();
    } else {
      return this.loadAsset(assetId);
    }
  }
}
