import { ENTER } from '@angular/cdk/keycodes';
import { TemplatePortal } from '@angular/cdk/portal';
import {
    ApplicationRef,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    inject,
    NgZone,
    TemplateRef,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import { Router } from '@angular/router';
import * as RD from '@devexperts/remote-data-ts';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import * as A from 'fp-ts/Array';
import { flow } from 'fp-ts/function';
import { Eq as eqNumber } from 'fp-ts/number';
import * as O from 'fp-ts/Option';
import {
    asyncScheduler,
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

import {
    AppPortalService,
    appSharedStateActions,
    fromAppShared,
    LifecycleHooks,
    LifecycleHooksDirective,
} from '@asset-sg/client-shared';
import { isTruthy, ORD, rdSequenceProps } from '@asset-sg/core';
import { LV95 } from '@asset-sg/shared';

import { BaseClientAssetSearchRefinement } from '../../models';
import * as actions from '../../state/asset-viewer.actions';
import { AppStateWithAssetViewer } from '../../state/asset-viewer.reducer';
import * as fromAssetViewer from '../../state/asset-viewer.selectors';

@UntilDestroy()
@Component({
    selector: 'asset-sg-viewer-page',
    templateUrl: './asset-viewer-page.component.html',
    styleUrls: ['./asset-viewer-page.component.scss'],
    hostDirectives: [LifecycleHooksDirective],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetViewerPageComponent {
    @ViewChild('templateAppBarPortalContent') templateAppBarPortalContent!: TemplateRef<unknown>;
    @ViewChild('templateDrawerPortalContent') templateDrawerPortalContent!: TemplateRef<unknown>;
    @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

    private _lc = inject(LifecycleHooks);
    private _appPortalService = inject(AppPortalService);
    private _viewContainerRef = inject(ViewContainerRef);
    private _store = inject(Store<AppStateWithAssetViewer>);
    private _appRef = inject(ApplicationRef);
    private _cd = inject(ChangeDetectorRef);
    private _ngZone = inject(NgZone);
    private _router = inject(Router);

    public rdReferenceDataVM$ = this._store.select(fromAppShared.selectRDReferenceDataVM);
    public drawerState$ = this._store.select(fromAssetViewer.selectDrawerState);
    public rdRefineVM$ = this._store.select(fromAssetViewer.selectRDRefineVM);
    public rdStudies$ = this._store.select(fromAssetViewer.selectRDStudies);
    public rdCurrentAssetDetail$ = this._store.select(fromAssetViewer.selectRDCurrentAssetDetailVM);
    public rdSearchAssets$ = this._store.select(fromAssetViewer.selectRDSearchAssets);
    public searchPolygon$ = this._store.select(fromAssetViewer.selectSearchPolygon);

    public currentAssetId$ = this.rdCurrentAssetDetail$.pipe(map(RD.map(a => a.assetId)), map(RD.toOption));

    public refinementChanged$ = new Subject<O.Option<BaseClientAssetSearchRefinement>>();
    public removePolygon$ = new Subject<void>();

    public _searchTextKeyDown$ = new Subject<KeyboardEvent>();
    private _searchTextChanged$ = this._searchTextKeyDown$.pipe(
        filter(ev => ev.keyCode === ENTER),
        map(ev => {
            const value = (ev.target as HTMLInputElement).value;
            return value ? O.some(value) : O.none;
        }),
    );

    public polygonChanged$ = new Subject<LV95[]>();
    public assetClicked$ = new Subject<number[]>();
    public closeSearchResultsClicked$ = new Subject<void>();
    public closeInstructions$ = new Subject<void>();

    public assetsForPicker$: Observable<fromAssetViewer.SearchAssetVM[]>;

    public highlightAssetStudies$ = new Subject<O.Option<number>>();

    constructor() {
        const setupPortals$ = this._lc.afterViewInit$.pipe(
            observeOn(asyncScheduler),
            switchMap(
                () =>
                    new Promise<void>(resolve => {
                        this._appPortalService.setAppBarPortalContent(
                            new TemplatePortal(this.templateAppBarPortalContent, this._viewContainerRef),
                        );
                        this._appPortalService.setDrawerPortalContent(
                            new TemplatePortal(this.templateDrawerPortalContent, this._viewContainerRef),
                        );
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
                switchMap(() => this._store.select(fromAssetViewer.selectSearchText)),
                untilDestroyed(this),
            )
            .subscribe(searchText => {
                if (O.toNullable(searchText) || '' !== this.searchInput.nativeElement.value || '') {
                    this.searchInput.nativeElement.value = O.toNullable(searchText) || '';
                }
            });

        const [singleStudyClicked$, multipleStudiesClicked$] = partition(
            this.assetClicked$.pipe(
                map(A.uniq(eqNumber)),
                filter(as => as.length > 0),
                share(),
            ),
            ss => ss.length === 1,
        );
        this.assetsForPicker$ = multipleStudiesClicked$.pipe(
            withLatestFrom(this.rdSearchAssets$),
            map(([assetIds, rdSearchAssets]) =>
                rdSequenceProps({ assetIds, searchAssets: rdSearchAssets }, 'searchAssets'),
            ),
            ORD.fromFilteredSuccess,
            map(({ assetIds, searchAssets }) => searchAssets.filter(a => assetIds.includes(a.assetId))),
        );

        singleStudyClicked$.pipe(untilDestroyed(this)).subscribe(assetIds => {
            this._router.navigate([], {
                queryParams: { assetId: assetIds[0] },
                queryParamsHandling: 'merge',
            });
        });

        merge(
            this.closeSearchResultsClicked$.pipe(map(() => actions.closeRefineAndResults())),
            this.closeInstructions$.pipe(map(() => appSharedStateActions.closePanel())),
            this.refinementChanged$.pipe(map(refinement => actions.refine({ refinement }))),
            this._searchTextChanged$.pipe(
                map(
                    flow(
                        O.map(text => actions.searchByText({ text })),
                        O.getOrElseW(() => actions.clearSearchText()),
                    ),
                ),
            ),
            this.polygonChanged$.pipe(map(polygon => actions.searchByPolygon({ polygon }))),
            this.removePolygon$.pipe(map(() => actions.removePolygon())),
        )
            .pipe(untilDestroyed(this))
            .subscribe(this._store);
    }

    public handleMapInitialised() {
        this._appRef.isStable.pipe(filter(isTruthy), take(1), delay(0), untilDestroyed(this)).subscribe(() => {
            this._ngZone.run(() => {
                this._store.dispatch(actions.mapInitialised());
            });
        });
    }
}
