import { ENTER } from '@angular/cdk/keycodes';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  AfterViewInit,
  ApplicationRef,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  inject,
  OnDestroy
} from '@angular/core';
import { Router } from '@angular/router';
import {
  AppPortalService,
  AppState,
  LifecycleHooks,
  LifecycleHooksDirective,
  appSharedStateActions,
} from '@asset-sg/client-shared';
import { isTruthy } from '@asset-sg/core';
import { AssetEditDetail, LV95 } from '@asset-sg/shared';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import * as A from 'fp-ts/Array';
import { flow } from 'fp-ts/function';
import { Eq as eqNumber } from 'fp-ts/number';
import * as O from 'fp-ts/Option';
import {
  Observable,
  Subject,
  asyncScheduler,
  delay,
  filter,
  map,
  merge,
  observeOn,
  partition,
  share,
  switchMap,
  take,
  withLatestFrom,
} from 'rxjs';

import * as actions from '../../state/asset-search/asset-search.actions';
import {
  selectAssetSearchPolygon,
  selectAssetSearchQuery,
  selectAssetSearchResultData,
  selectCurrentAssetDetail,
  selectDrawerState,
} from '../../state/asset-search/asset-search.selector';

@UntilDestroy()
@Component({
  selector: 'asset-sg-viewer-page',
  templateUrl: './asset-viewer-page.component.html',
  styleUrls: ['./asset-viewer-page.component.scss'],
  hostDirectives: [LifecycleHooksDirective],
})
export class AssetViewerPageComponent implements OnDestroy {
    @ViewChild('templateAppBarPortalContent') templateAppBarPortalContent!: TemplateRef<unknown>;
    @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  private _lc = inject(LifecycleHooks);
  private _appPortalService = inject(AppPortalService);
  private _viewContainerRef = inject(ViewContainerRef);
  private _store = inject(Store<AppState>);
  private _appRef = inject(ApplicationRef);
  private _cd = inject(ChangeDetectorRef);
  private _ngZone = inject(NgZone);
  private _router = inject(Router);

  public drawerState$ = this._store.select(selectDrawerState);
  public searchPolygon$ = this._store.select(selectAssetSearchPolygon).pipe(map(O.fromNullable));
  public currentAssetId$ = this._store.select(selectCurrentAssetDetail).pipe(
    map((currentAsset) => currentAsset?.assetId),
    map(O.fromNullable)
  );
  public removePolygon$ = new Subject<void>();
  public isFiltersOpen$ = this._store.select(fromAssetViewer.selectIsFiltersOpen);

  public _searchTextKeyDown$ = new Subject<KeyboardEvent>();
  private _searchTextChanged$ = this._searchTextKeyDown$.pipe(
    filter((ev) => ev.keyCode === ENTER),
    map((ev) => {
      const value = (ev.target as HTMLInputElement).value;
      return value ? O.some(value) : O.none;
    })
  );

  public polygonChanged$ = new Subject<LV95[]>();
  public assetClicked$ = new Subject<number[]>();
  public closeSearchResultsClicked$ = new Subject<void>();
  public closeInstructions$ = new Subject<void>();
  public assetsForPicker$: Observable<AssetEditDetail[]>;
  public highlightAssetStudies$ = new Subject<O.Option<number>>();

  public ngAfterViewInit() {
    this._store.dispatch(actions.readParams());
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
      this._store.dispatch(actions.searchForAssetDetail({ assetId: assetIds[0] }));
      this._router.navigate([], {
        queryParams: { assetId: assetIds[0] },
        queryParamsHandling: 'merge',
      });
    });

    merge(
      this.closeSearchResultsClicked$.pipe(map(() => actions.closeRefineAndResults())),
      this.closeInstructions$.pipe(map(() => appSharedStateActions.closePanel())),
      this._searchTextChanged$.pipe(
        map(
          flow(
            O.map((text) => actions.searchByFilterConfiguration({ filterConfiguration: { text } })),
            O.getOrElseW(() => actions.clearSearchText())
          )
        )
      ),
      this.polygonChanged$.pipe(
        map((polygon) => actions.searchByFilterConfiguration({ filterConfiguration: { polygon } }))
      ),
      this.removePolygon$.pipe(map(() => actions.removePolygon()))
    )
      .pipe(untilDestroyed(this))
      .subscribe(this._store);
  }

    ngOnDestroy() {
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
