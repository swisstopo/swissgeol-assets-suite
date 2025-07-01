import { Component, ElementRef, EventEmitter, inject, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { fromAppShared } from '@asset-sg/client-shared';
import { AssetContact, AssetContactRole, AssetSearchResultItem, sleep, tick } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatestWith, firstValueFrom, map, Subject, Subscription, switchMap, take } from 'rxjs';
import { ViewerControllerService } from '../../services/viewer-controller.service';
import * as actions from '../../state/asset-search/asset-search.actions';
import { PanelState, setScrollOffsetForResults } from '../../state/asset-search/asset-search.actions';
import { AppStateWithAssetSearch } from '../../state/asset-search/asset-search.reducer';
import {
  selectIsResultsOpen,
  selectScrollOffsetForResults,
  selectSearchResultItems,
  selectSearchStats,
} from '../../state/asset-search/asset-search.selector';

@Component({
  selector: 'asset-sg-asset-search-results',
  templateUrl: './asset-search-results.component.html',
  styleUrls: ['./asset-search-results.component.scss'],
  standalone: false,
})
export class AssetSearchResultsComponent implements OnInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLElement>;

  @Output() closeSearchResultsClicked = new EventEmitter<void>();
  @Output() assetMouseOver = new EventEmitter<number | null>();

  protected readonly COLUMNS = [
    'favourites',
    'titlePublic',
    'assetFormat',
    'manCatLabel',
    'authors',
    'initiators',
    'createDate',
  ];

  public allResults$ = new BehaviorSubject<AssetSearchResultItem[]>([]);

  public resultsToDisplay: AssetSearchResultItem[] = [];
  private size = 0;
  private readonly pageSize = 50;

  private readonly store = inject(Store<AppStateWithAssetSearch>);
  private readonly viewerControllerService = inject(ViewerControllerService);
  public readonly isResultsOpen$ = this.store.select(selectIsResultsOpen);
  public readonly assets$ = this.store.select(selectSearchResultItems);
  public readonly total$ = this.store.select(selectSearchStats).pipe(map((stats) => stats.total));
  public readonly currentAsset$ = this.store.select(fromAppShared.selectCurrentAsset);
  public readonly scrollOffset$ = this.store.select(selectScrollOffsetForResults);

  private readonly subscriptions: Subscription = new Subscription();

  private timeoutForSetOffset: number | null = null;

  private readonly resultsReady$ = new Subject<void>();
  private readonly isTableReady$ = new Subject<void>();

  public ngOnInit(): void {
    this.initSubscriptions();
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public searchForAsset(assetId: number): void {
    this.viewerControllerService.selectAsset(assetId);
  }

  public async toggleResultsOpen(): Promise<void> {
    const isOpen = await firstValueFrom(this.isResultsOpen$);
    if (isOpen) {
      this.saveScrollToStore(0);
      this.store.dispatch(actions.setResultsState({ state: PanelState.ClosedManually }));
    } else {
      this.store.dispatch(actions.setResultsState({ state: PanelState.OpenedManually }));
    }
  }

  public onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.offsetHeight + target.scrollTop >= target.scrollHeight) {
      this.size += this.pageSize;
      this.resultsToDisplay = this.allResults.slice(0, this.size);
    }
    this.saveScrollToStore(target.scrollTop);
  }

  private saveScrollToStore(offset: number): void {
    if (this.timeoutForSetOffset !== null) {
      clearTimeout(this.timeoutForSetOffset);
    }
    this.timeoutForSetOffset = setTimeout(() => {
      this.store.dispatch(setScrollOffsetForResults({ offset }));
    }, 250);
  }

  private async scrollByOffset(offset: number): Promise<void> {
    const container = this.scrollContainer?.nativeElement;
    const table = container?.children[0] as HTMLTableElement | undefined;
    if (container === undefined || table === undefined) {
      throw new Error("Can't scroll, table is not rendered.");
    }

    const MIN_ROW_HEIGHT = 52;
    const minimalElementCount = offset / MIN_ROW_HEIGHT;
    const minimalRequiredPageSize = Math.ceil(minimalElementCount / this.pageSize) * this.pageSize;

    this.size = Math.max(minimalRequiredPageSize, this.pageSize);
    this.resultsToDisplay = this.allResults.slice(0, this.size);

    await tick();
    while (table.clientHeight <= offset && this.size < this.allResults.length) {
      this.size += this.pageSize;
      this.resultsToDisplay = this.allResults.slice(0, this.size);
      await tick();
    }

    await sleep(100);
    container.scrollTo({ top: offset, behavior: 'smooth' });
  }

  private initSubscriptions(): void {
    // Scroll to the offset stored in the store.
    this.viewerControllerService.viewerReady$
      .pipe(
        combineLatestWith(this.isTableReady$, this.resultsReady$),
        take(1),
        switchMap(() => this.scrollOffset$),
        take(1),
        switchMap((offset) => this.scrollByOffset(offset)),
      )
      .subscribe();

    // Subscribe to results.
    this.subscriptions.add(
      this.viewerControllerService.viewerReady$.pipe(switchMap(() => this.assets$)).subscribe(async (assets) => {
        this.allResults$.next(assets);
        this.size = Math.min(this.pageSize, assets.length);
        this.resultsToDisplay = this.allResults.slice(0, this.size);
        const container = this.scrollContainer?.nativeElement;
        if (container !== undefined) {
          await tick();
          container.scrollTo({ top: 0, behavior: 'smooth' });
        }
        this.resultsReady$.next();
      }),
    );

    // Emit `isTableReady$` when the table has been rendered.
    let isOpen = false;
    this.subscriptions.add(
      this.isResultsOpen$.subscribe(async (isNowOpen) => {
        isOpen = isNowOpen;
        if (!isOpen) {
          return;
        }
        while (isOpen) {
          await tick();
          const table = this.scrollContainer?.nativeElement?.children[0] as HTMLTableElement | undefined;
          if (table != null) {
            this.isTableReady$.next();
            break;
          }
        }
      }),
    );
  }

  private get allResults(): AssetSearchResultItem[] {
    return this.allResults$.value;
  }

  protected trackContact(contact: AssetContact) {
    return `${contact.id}-${contact.role}`;
  }

  protected readonly AssetContactRole = AssetContactRole;
}
