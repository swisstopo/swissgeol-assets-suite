import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import * as O from 'fp-ts/Option';
import { Observable } from 'rxjs';

import { AssetEditDetail } from '@asset-sg/shared';

import { AppStateWithAssetSearch, LoadingState } from '../../state/asset-search/asset-search.reducer';
import {
  selectAssetSearchPageData,
  selectAssetSearchResultData,
  selectSearchLoadingState,
} from '../../state/asset-search/asset-search.selector';

@Component({
  selector: 'asset-sg-asset-search-results',
  templateUrl: './asset-search-results.component.html',
  styleUrls: ['./asset-search-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetSearchResultsComponent {
  @Input() public currentAssetId$!: Observable<O.Option<number>>;
  @Output('closeSearchResultsClicked') closeSearchResultsClicked = new EventEmitter<void>();
  @Output('assetMouseOver') assetMouseOver$ = new EventEmitter<O.Option<number>>();

  public _store = inject(Store<AppStateWithAssetSearch>);
  public assets$: Observable<AssetEditDetail[]> = this._store.select(selectAssetSearchResultData);
  public loadingState = this._store.select(selectSearchLoadingState);
  public pageStats$ = this._store.select(selectAssetSearchPageData);

  public onAssetMouseOver(assetId: number) {
    this.assetMouseOver$.emit(O.some(assetId));
  }

  public onAssetMouseOut() {
    this.assetMouseOver$.emit(O.none);
  }

  protected readonly LoadingState = LoadingState;
}
