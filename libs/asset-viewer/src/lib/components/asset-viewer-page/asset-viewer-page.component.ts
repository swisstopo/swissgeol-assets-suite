import { TemplatePortal } from '@angular/cdk/portal';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import {
  AppPortalService,
  AppSharedState,
  AuthService,
  fromAppShared,
  LifecycleHooks,
  LifecycleHooksDirective,
} from '@asset-sg/client-shared';
import { AssetSearchResultItem } from '@asset-sg/shared/v2';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import * as A from 'fp-ts/Array';
import { Eq as eqNumber } from 'fp-ts/number';
import {
  asyncScheduler,
  filter,
  identity,
  map,
  Observable,
  observeOn,
  partition,
  share,
  Subject,
  switchMap,
  take,
  withLatestFrom,
} from 'rxjs';

import { ViewerControllerService } from '../../services/viewer-controller.service';
import * as actions from '../../state/asset-search/asset-search.actions';
import { PanelState } from '../../state/asset-search/asset-search.actions';
import { AppStateWithAssetSearch, AssetSearchState } from '../../state/asset-search/asset-search.reducer';
import {
  selectIsFiltersOpen,
  selectSearchQuery,
  selectSearchResults,
} from '../../state/asset-search/asset-search.selector';

@UntilDestroy()
@Component({
  selector: 'asset-sg-viewer-page',
  templateUrl: './asset-viewer-page.component.html',
  styleUrls: ['./asset-viewer-page.component.scss'],
  standalone: false,
  hostDirectives: [LifecycleHooksDirective],
})
export class AssetViewerPageComponent implements OnInit, OnDestroy {
  @ViewChild('templateAppBarPortalContent') templateAppBarPortalContent!: TemplateRef<unknown>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  private readonly _lc = inject(LifecycleHooks);
  private readonly _appPortalService = inject(AppPortalService);
  private readonly _viewContainerRef = inject(ViewContainerRef);
  private readonly store = inject(Store<AppStateWithAssetSearch>);
  private readonly _cd = inject(ChangeDetectorRef);

  private readonly authService = inject(AuthService);
  private readonly viewerControllerService = inject(ViewerControllerService);

  public isLoading$ = this.store.pipe(
    map((store): { search: AssetSearchState; shared: AppSharedState } => {
      return { search: store.assetSearch, shared: store.shared };
    }),
    map(
      ({ search, shared }) =>
        search.isLoadingGeometries ||
        search.isLoadingResults ||
        search.isLoadingStats ||
        // Loading for the current asset is only shown on the map in case an asset is already being displayed.
        // Otherwise, the detail panel shows a loader.
        (shared.isLoadingAsset && shared.currentAsset !== null),
    ),
  );

  public currentAssetId$ = this.store.select(fromAppShared.selectCurrentAsset).pipe(map((asset) => asset?.id ?? null));

  public hasCurrentAsset$ = this.store.select(fromAppShared.selectHasCurrentAsset);

  public isFiltersOpen$ = this.store.select(selectIsFiltersOpen);

  public _searchTextKeyDown$ = new Subject<KeyboardEvent>();
  private readonly searchTextChanged$ = this._searchTextKeyDown$.pipe(
    filter((event) => event.key === 'Enter'),
    map((event) => (event.target as HTMLInputElement).value),
  );

  public assetClicked$ = new Subject<number[]>();
  public assetsForPicker$: Observable<AssetSearchResultItem[]>;
  public highlightedAssetId: number | null = null;

  constructor() {
    const setupPortals$ = this._lc.afterViewInit$.pipe(
      observeOn(asyncScheduler),
      switchMap(
        () =>
          new Promise<void>((resolve) => {
            this._appPortalService.setAppBarPortalContent(
              new TemplatePortal(this.templateAppBarPortalContent, this._viewContainerRef),
            );
            this._appPortalService.setDrawerPortalContent(null);
            setTimeout(() => {
              this._cd.detectChanges();
              resolve();
            });
          }),
      ),
      share(),
    );
    setupPortals$.pipe(untilDestroyed(this)).subscribe();

    setupPortals$
      .pipe(
        switchMap(() => this.store.select(selectSearchQuery)),
        untilDestroyed(this),
      )
      .subscribe((searchQuery) => {
        if (this.searchInput == null) {
          return;
        }
        if (searchQuery.text || '' !== this.searchInput.nativeElement.value || '') {
          this.searchInput.nativeElement.value = searchQuery.text ?? '';
        }
      });

    const [singleGeometryClicked$, multipleGeometriesClicked$] = partition(
      this.assetClicked$.pipe(
        map(A.uniq(eqNumber)),
        filter((as) => as.length > 0),
        share(),
      ),
      (ss) => ss.length === 1,
    );

    this.assetsForPicker$ = multipleGeometriesClicked$.pipe(
      withLatestFrom(this.store.select(selectSearchResults)),
      map(([assetIds, searchAssets]) => searchAssets.data.filter((a) => assetIds.includes(a.id))),
    );

    singleGeometryClicked$.pipe(untilDestroyed(this)).subscribe((assetIds) => {
      this.viewerControllerService.selectAsset(assetIds[0]);
    });

    this.searchTextChanged$.pipe(untilDestroyed(this)).subscribe((text) => {
      this.store.dispatch(actions.updateSearchQuery({ query: { text } }));
    });
  }

  public ngOnInit() {
    this.store.dispatch(actions.setFiltersState({ state: PanelState.OpenedAutomatically }));

    this.authService.isInitialized$.pipe(filter(identity), take(1)).subscribe(() => {
      this.viewerControllerService.initialize();
    });
    this._appPortalService.setAppBarPortalContent(null);
  }

  ngOnDestroy() {
    this._appPortalService.setAppBarPortalContent(null);
    this.viewerControllerService.reset();
  }
}
