import { Component, ElementRef, EventEmitter, inject, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { AssetExportService, fromAppShared, MAX_EXPORT_ASSETS, PdfOverlayService } from '@asset-sg/client-shared';
import {
  AssetContact,
  AssetContactRole,
  AssetId,
  AssetSearchResultItem,
  FileSearchResultItem,
  FileSearchResultPage,
  SearchType,
  sleep,
  tick,
} from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatestWith, firstValueFrom, map, Subject, Subscription, switchMap, take } from 'rxjs';
import { AssetSearchService } from '../../services/asset-search.service';
import { ViewerControllerService } from '../../services/viewer-controller.service';
import * as actions from '../../state/asset-search/asset-search.actions';
import { PanelState, setScrollOffsetForResults } from '../../state/asset-search/asset-search.actions';
import { AppStateWithAssetSearch } from '../../state/asset-search/asset-search.reducer';
import {
  selectFileSearchResultItems,
  selectFileTotal,
  selectIsResultsOpen,
  selectScrollOffsetForResults,
  selectSearchQuery,
  selectSearchResultItems,
  selectSearchResults,
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
    'select',
    'favourites',
    'titlePublic',
    'assetFormat',
    'manCatLabel',
    'authors',
    'initiators',
    'createDate',
  ];

  protected readonly FILE_COLUMNS = ['actions', 'fileName', 'assetTitle', 'pages'];

  public allResults$ = new BehaviorSubject<AssetSearchResultItem[]>([]);

  public resultsToDisplay: AssetSearchResultItem[] = [];
  public fileResultsToDisplay: FileSearchResultItem[] = [];
  protected readonly selectedAssetIds = new Set<AssetId>();
  private size = 0;
  private readonly pageSize = 50;
  private isRestoringScroll = false;

  private readonly store = inject(Store<AppStateWithAssetSearch>);
  private readonly viewerControllerService = inject(ViewerControllerService);
  private readonly pdfOverlayService = inject(PdfOverlayService);
  private readonly assetSearchService = inject(AssetSearchService);
  private readonly assetExportService = inject(AssetExportService);
  public readonly isResultsOpen$ = this.store.select(selectIsResultsOpen);
  public readonly assets$ = this.store.select(selectSearchResultItems);
  public readonly fileResults$ = this.store.select(selectFileSearchResultItems);
  public readonly total$ = this.store.select(selectSearchStats).pipe(map((stats) => stats.total));
  public readonly fileTotal$ = this.store.select(selectFileTotal);
  public readonly currentAsset$ = this.store.select(fromAppShared.selectCurrentAsset);
  public readonly scrollOffset$ = this.store.select(selectScrollOffsetForResults);
  public readonly searchQuery$ = this.store.select(selectSearchQuery);

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

  protected get hasSelectedAssets(): boolean {
    return this.selectedAssetIds.size > 0;
  }

  protected get selectedCountLabel(): string {
    const count = this.selectedAssetIds.size;
    return count > MAX_EXPORT_ASSETS ? `>${MAX_EXPORT_ASSETS}` : String(count);
  }

  protected get areAllLoadedSelected(): boolean {
    return this.allResults.length > 0 && this.allResults.every((asset) => this.selectedAssetIds.has(asset.id));
  }

  protected get isSomeLoadedSelected(): boolean {
    const selectedInResults = this.allResults.filter((asset) => this.selectedAssetIds.has(asset.id)).length;
    return selectedInResults > 0 && selectedInResults < this.allResults.length;
  }

  protected get showSelectAllCapHint(): boolean {
    return this.searchResultTotal > this.allResults.length;
  }

  private searchResultTotal = 0;

  protected isSelected(assetId: AssetId): boolean {
    return this.selectedAssetIds.has(assetId);
  }

  protected toggleAsset(assetId: AssetId, event: MatCheckboxChange): void {
    if (event.checked) {
      this.selectedAssetIds.add(assetId);
      return;
    }
    this.selectedAssetIds.delete(assetId);
  }

  protected toggleAllLoaded(event: MatCheckboxChange): void {
    const ids = this.allResults.map((asset) => asset.id);
    if (event.checked) {
      for (const id of ids) {
        this.selectedAssetIds.add(id);
      }
      return;
    }
    for (const id of ids) {
      this.selectedAssetIds.delete(id);
    }
  }

  protected async exportSelected(): Promise<void> {
    await this.assetExportService.export([...this.selectedAssetIds]);
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
    this.saveScrollToStore(target.scrollTop);

    if (this.isRestoringScroll) {
      return;
    }

    const hasOverflow = target.scrollHeight > target.clientHeight;
    const scrolledToBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1;
    if (hasOverflow && scrolledToBottom && this.size < this.allResults.length) {
      this.size = Math.min(this.size + this.pageSize, this.allResults.length);
      this.updateDisplayedResults();
    }
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

    this.isRestoringScroll = true;
    try {
      if (offset <= 0) {
        this.size = Math.min(this.pageSize, this.allResults.length);
        this.updateDisplayedResults();
        container.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const MIN_ROW_HEIGHT = 52;
      const minimalElementCount = offset / MIN_ROW_HEIGHT;
      const minimalRequiredPageSize = Math.ceil(minimalElementCount / this.pageSize) * this.pageSize;

      this.size = Math.min(Math.max(minimalRequiredPageSize, this.pageSize), this.allResults.length);
      this.updateDisplayedResults();

      await tick();
      while (table.clientHeight <= offset && this.size < this.allResults.length) {
        this.size = Math.min(this.size + this.pageSize, this.allResults.length);
        this.updateDisplayedResults();
        await tick();
      }

      await sleep(100);
      container.scrollTo({ top: offset, behavior: 'smooth' });
    } finally {
      this.isRestoringScroll = false;
    }
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
        this.clearSelection();
        this.allResults$.next(assets);
        this.searchResultTotal = (await firstValueFrom(this.store.select(selectSearchResults))).page.total;
        this.size = Math.min(this.pageSize, assets.length);
        this.updateDisplayedResults();
        const container = this.scrollContainer?.nativeElement;
        if (container !== undefined) {
          await tick();
          container.scrollTo({ top: 0, behavior: 'smooth' });
        }
        this.resultsReady$.next();
      }),
    );

    // Subscribe to file results.
    this.subscriptions.add(
      this.viewerControllerService.viewerReady$.pipe(switchMap(() => this.fileResults$)).subscribe((fileResults) => {
        this.fileResultsToDisplay = fileResults;
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

  protected async openPdf(file: FileSearchResultItem, initialPageNumber?: number): Promise<void> {
    const asset = await firstValueFrom(this.assetSearchService.fetchAsset(file.assetId));
    initialPageNumber ??= file.pages.length > 0 ? file.pages[0].page : undefined;
    this.pdfOverlayService.openPdfOverlay({
      assetId: file.assetId,
      initialPdfId: file.fileId,
      initialPageNumber,
      assetPdfs: asset.files
        .filter((f) => f.name.endsWith('.pdf'))
        .map((f) => ({
          id: f.id,
          fileName: f.alias ?? f.name,
          pageRangeClassifications: f.pageRangeClassifications,
        })),
    });
  }

  protected pagesWithContent(pages: FileSearchResultPage[]) {
    return pages.filter((p) => p.highlights.length > 0);
  }

  private get allResults(): AssetSearchResultItem[] {
    return this.allResults$.value;
  }

  private updateDisplayedResults(): void {
    this.resultsToDisplay = this.allResults.slice(0, this.size);
  }

  private clearSelection(): void {
    this.selectedAssetIds.clear();
  }

  protected trackContact(contact: AssetContact) {
    return `${contact.id}-${contact.role}`;
  }

  protected readonly AssetContactRole = AssetContactRole;
  protected readonly SearchType = SearchType;
}
