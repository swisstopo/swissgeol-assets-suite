import { AssetEditDetail } from '@asset-sg/shared';
import { Store } from '@ngrx/store';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import * as O from 'fp-ts/Option';
import { Observable } from 'rxjs';

import { AppStateWithAssetSearch, LoadingState } from '../../state/asset-search/asset-search.reducer';
import {
  selectAssetSearchPageData,
  selectAssetSearchResultData,
  selectSearchLoadingState,
} from '../../state/asset-search/asset-search.selector';

import { Store } from '@ngrx/store';
import { AppStateWithAssetViewer } from '../../state/asset-viewer.reducer';
import * as fromAssetViewer from '../../state/asset-viewer.selectors';
import * as actions from '../../state/asset-viewer.actions';

@Component({
  selector: 'asset-sg-asset-search-results',
  templateUrl: './asset-search-results.component.html',
  styleUrls: ['./asset-search-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetSearchResultsComponent {
    @Input() public currentAssetId$!: Observable<O.Option<number>>;
  @Output() closeSearchResultsClicked = new EventEmitter<void>();
  @Output() assetMouseOver$ = new EventEmitter<O.Option<number>>();

    private _store = inject(Store<AppStateWithAssetViewer>);
    public isResultsOpen$ = this._store.select(fromAssetViewer.selectIsResultsOpen);
  public assets$: Observable<AssetEditDetail[]> = this._store.select(selectAssetSearchResultData);
  public loadingState = this._store.select(selectSearchLoadingState);
  public pageStats$ = this._store.select(selectAssetSearchPageData);

  public onAssetMouseOver(assetId: number) {
    this.assetMouseOver.emit(O.some(assetId));
  }



  protected readonly LoadingState = LoadingState;
    public onAssetMouseOut() {
        this.assetMouseOver$.emit(O.none);
    }

    public toggleResultsOpen(isCurrentlyOpen: boolean) {
        if (isCurrentlyOpen) {
            this._store.dispatch(actions.closeResults());
        } else {
            this._store.dispatch(actions.openResults());
        }
    }
}
