import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import * as actions from '../../state/asset-search/asset-search.actions';
import { AppStateWithAssetSearch } from '../../state/asset-search/asset-search.reducer';
import {
  AssetEditDetailVM,
  selectAssetEditDetailVM,
  selectAssetSearchPageData,
  selectCurrentAssetDetail,
  selectIsResultsOpen,
} from '../../state/asset-search/asset-search.selector';

@Component({
  selector: 'asset-sg-asset-search-results',
  templateUrl: './asset-search-results.component.html',
  styleUrls: ['./asset-search-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetSearchResultsComponent implements OnInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer?: ElementRef;
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

  public allResults: AssetEditDetailVM[] = [];
  public resultsToDisplay: AssetEditDetailVM[] = [];
  private size = 0;
  private limit = 100;

  private readonly _store = inject(Store<AppStateWithAssetSearch>);
  public readonly isResultsOpen$ = this._store.select(selectIsResultsOpen);
  public readonly assets$ = this._store.select(selectAssetEditDetailVM);
  public readonly pageStats$ = this._store.select(selectAssetSearchPageData);
  public readonly currentAssetDetail$ = this._store.select(selectCurrentAssetDetail);
  private readonly subscriptions: Subscription = new Subscription();

  public ngOnInit() {
    this.initSubscriptions();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public searchForAsset(assetId: number) {
    this._store.dispatch(actions.assetClicked({ assetId }));
  }

  public toggleResultsOpen(isCurrentlyOpen: boolean) {
    if (isCurrentlyOpen) {
      this._store.dispatch(actions.closeResults());
    } else {
      this._store.dispatch(actions.openResults());
    }
  }

  public onScroll(event: Event) {
    const target = event.target as HTMLElement;

    if (target.offsetHeight + target.scrollTop >= target.scrollHeight) {
      this.size += this.limit;
      this.resultsToDisplay = this.allResults.slice(0, this.size);
    }
  }

  private initSubscriptions() {
    this.subscriptions.add(
      this.assets$.subscribe((assets) => {
        this.allResults = assets;
        this.size = this.limit;
        this.resultsToDisplay = this.allResults.slice(0, this.size);
        if (this.scrollContainer) {
          this.scrollContainer.nativeElement.scrollTop = 0;
        }
      })
    );
  }
}
