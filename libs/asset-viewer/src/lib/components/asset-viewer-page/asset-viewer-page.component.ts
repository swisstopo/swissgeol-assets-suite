import { TemplatePortal } from '@angular/cdk/portal';
import {
  AfterViewInit,
  ApplicationRef,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { AppPortalService, AppState, LifecycleHooks, LifecycleHooksDirective } from '@asset-sg/client-shared';
import { isTruthy } from '@asset-sg/core';
import { AssetEditDetail } from '@asset-sg/shared';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import * as A from 'fp-ts/Array';
import { flow } from 'fp-ts/function';
import { Eq as eqNumber } from 'fp-ts/number';
import * as O from 'fp-ts/Option';
import {
  asyncScheduler,
  combineLatest,
  delay,
  filter,
  map,
  merge,
  Observable,
  observeOn,
  partition,
  share,
  Subject,
  switchMap,
  take,
  withLatestFrom,
} from 'rxjs';

import * as actions from '../../state/asset-search/asset-search.actions';
import { LoadingState } from '../../state/asset-search/asset-search.reducer';
import {
  selectAssetDetailLoadingState,
  selectAssetSearchQuery,
  selectAssetSearchResultData,
  selectCurrentAssetDetail,
  selectFilterLoadingState,
  selectIsFiltersOpen,
  selectIsMapInitialized,
  selectSearchLoadingState,
} from '../../state/asset-search/asset-search.selector';

@UntilDestroy()
@Component({
  selector: 'asset-sg-viewer-page',
  templateUrl: './asset-viewer-page.component.html',
  styleUrls: ['./asset-viewer-page.component.scss'],
  hostDirectives: [LifecycleHooksDirective],
})
export class AssetViewerPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('templateAppBarPortalContent') templateAppBarPortalContent!: TemplateRef<unknown>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  private _lc = inject(LifecycleHooks);
  private _appPortalService = inject(AppPortalService);
  private _viewContainerRef = inject(ViewContainerRef);
  private _store = inject(Store<AppState>);
  private _appRef = inject(ApplicationRef);
  private _cd = inject(ChangeDetectorRef);
  private _ngZone = inject(NgZone);

  public isLoading$ = combineLatest(
    [
      this._store.select(selectIsMapInitialized),
      this._store.select(selectFilterLoadingState),
      this._store.select(selectSearchLoadingState),
      this._store.select(selectAssetDetailLoadingState),
    ],
    (isMapInitialized, filterLoadingState, searchLoadingState, detailLoadingState) =>
      !isMapInitialized ||
      filterLoadingState === LoadingState.Loading ||
      searchLoadingState === LoadingState.Loading ||
      detailLoadingState === LoadingState.Loading
  );
  public currentAssetId$ = this._store.select(selectCurrentAssetDetail).pipe(
    map((currentAsset) => currentAsset?.assetId),
    map(O.fromNullable)
  );
  public currentAsset$ = this._store.select(selectCurrentAssetDetail);
  public isFiltersOpen$ = this._store.select(selectIsFiltersOpen);

  public _searchTextKeyDown$ = new Subject<KeyboardEvent>();
  private _searchTextChanged$ = this._searchTextKeyDown$.pipe(
    filter((ev) => ev.key === 'Enter'),
    map((ev) => {
      const value = (ev.target as HTMLInputElement).value;
      return value ? O.some(value) : O.none;
    })
  );

  public assetClicked$ = new Subject<number[]>();
  public closeSearchResultsClicked$ = new Subject<void>();
  public assetsForPicker$: Observable<AssetEditDetail[]>;
  public highlightedAssetId: number | null = null;

  public ngAfterViewInit() {
    this._store.dispatch(actions.initializeSearch());
    this._appPortalService.setAppBarPortalContent(null);
  }

  constructor() {
    const setupPortals$ = this._lc.afterViewInit$.pipe(
      observeOn(asyncScheduler),
      switchMap(
        () =>
          new Promise<void>((resolve) => {
            this._appPortalService.setAppBarPortalContent(
              new TemplatePortal(this.templateAppBarPortalContent, this._viewContainerRef)
            );
            this._appPortalService.setDrawerPortalContent(null);
            setTimeout(() => {
              this._cd.detectChanges();
              resolve();
            });
          })
      ),
      share()
    );
    setupPortals$.pipe(untilDestroyed(this)).subscribe();

    setupPortals$
      .pipe(
        switchMap(() => this._store.select(selectAssetSearchQuery)),
        untilDestroyed(this)
      )
      .subscribe((searchQuery) => {
        if (this.searchInput == null) {
          return;
        }
        if (searchQuery.text || '' !== this.searchInput.nativeElement.value || '') {
          this.searchInput.nativeElement.value = searchQuery.text || '';
        }
      });

    const [singleStudyClicked$, multipleStudiesClicked$] = partition(
      this.assetClicked$.pipe(
        map(A.uniq(eqNumber)),
        filter((as) => as.length > 0),
        share()
      ),
      (ss) => ss.length === 1
    );

    this.assetsForPicker$ = multipleStudiesClicked$.pipe(
      withLatestFrom(this._store.select(selectAssetSearchResultData)),
      map(([assetIds, searchAssets]) => searchAssets.filter((a) => assetIds.includes(a.assetId)))
    );

    singleStudyClicked$.pipe(untilDestroyed(this)).subscribe((assetIds) => {
      this._store.dispatch(actions.assetClicked({ assetId: assetIds[0] }));
    });

    merge(
      this.closeSearchResultsClicked$.pipe(map(() => actions.closeRefineAndResults())),
      this._searchTextChanged$.pipe(
        map(
          flow(
            O.map((text) => actions.searchByFilterConfiguration({ filterConfiguration: { text } })),
            O.getOrElseW(() => actions.clearSearchText())
          )
        )
      )
    )
      .pipe(untilDestroyed(this))
      .subscribe(this._store);
  }

  ngOnDestroy() {
    this._store.dispatch(actions.closeFilters());
    this._appPortalService.setAppBarPortalContent(null);
  }

  public handleMapInitialised() {
    this._appRef.isStable.pipe(filter(isTruthy), take(1), delay(0), untilDestroyed(this)).subscribe(() => {
      this._ngZone.run(() => {
        this._store.dispatch(actions.mapInitialised());
      });
    });
  }
}
