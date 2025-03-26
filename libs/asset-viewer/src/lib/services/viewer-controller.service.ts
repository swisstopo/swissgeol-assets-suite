import { inject, Injectable } from '@angular/core';
import { AssetSearchQuery, isEmptySearchQuery, makeEmptyAssetSearchResults } from '@asset-sg/shared';
import { AssetId } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  identity,
  map,
  Observable,
  ReplaySubject,
  skip,
  Subscription,
  take,
} from 'rxjs';
import { DEFAULT_MAP_POSITION } from '../components/map/map-controller';
import * as actions from '../state/asset-search/asset-search.actions';
import {
  setFiltersOpen,
  setMapPosition,
  setQuery,
  setResultsOpen,
  setScrollOffsetForResults,
} from '../state/asset-search/asset-search.actions';
import { AppStateWithAssetSearch, AssetSearchUiState } from '../state/asset-search/asset-search.reducer';
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
import { ViewerParamsService } from './viewer-params.service';

@Injectable({ providedIn: 'root' })
export class ViewerControllerService {
  private readonly store = inject(Store<AppStateWithAssetSearch>);
  private readonly viewerParamsService = inject(ViewerParamsService);
  private readonly assetSearchService = inject(AssetSearchService);
  private readonly allStudyService = inject(AllStudyService);

  private viewerReadySubject = new ReplaySubject<void>(1);

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
  }

  selectAsset(id: AssetId): void {
    this.loadAsset(id).then();
  }

  private async initializeFromStore(): Promise<void> {
    const params = await this.viewerParamsService.readParamsFromUrl();

    const { ui, query, assetId } = params;
    this.store.dispatch(setScrollOffsetForResults({ offset: ui.scrollOffsetForResults }));
    this.store.dispatch(setFiltersOpen({ isOpen: ui.isFiltersOpen }));
    this.store.dispatch(setResultsOpen({ isOpen: ui.isResultsOpen }));
    this.store.dispatch(setMapPosition({ position: ui.map }));
    this.store.dispatch(setQuery({ query }));

    const loads: Array<Promise<void>> = [];

    const studies = await firstValueFrom(this.store.select(selectStudies));
    if (studies.length === 0) {
      loads.push(this.loadStudies());
    }

    loads.push(this.loadResults(query, { force: ui.isResultsOpen }));
    loads.push(this.loadStats(query));

    if (assetId !== null) {
      loads.push(this.loadAsset(assetId));
    }

    await Promise.all(loads);

    this.subscription.add(this.syncUrlParams());
    this.subscription.add(this.loadResultsWhenPanelIsOpened());
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
    return combineLatest([
      this.store.select(selectSearchQuery).pipe(distinctUntilChanged()),
      this.store.select(selectCurrentAsset).pipe(distinctUntilChanged()),
      combineLatest([
        this.store.select(selectScrollOffsetForResults).pipe(distinctUntilChanged()),
        this.store.select(selectIsFiltersOpen).pipe(distinctUntilChanged()),
        this.store.select(selectIsResultsOpen).pipe(distinctUntilChanged()),
        this.store.select(selectMapPosition).pipe(distinctUntilChanged()),
      ]).pipe(
        map(
          ([scrollOffsetForResults, isFiltersOpen, isResultsOpen, map]): AssetSearchUiState => ({
            scrollOffsetForResults,
            isFiltersOpen,
            isResultsOpen,
            map,
          })
        )
      ),
    ])
      .pipe(
        skip(1),
        map(([query, asset, ui]) => ({
          query,
          ui,
          assetId: asset?.assetId ?? null,
        }))
      )
      .subscribe((params) => {
        this.viewerParamsService.writeParamsToUrl(params);
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
}
