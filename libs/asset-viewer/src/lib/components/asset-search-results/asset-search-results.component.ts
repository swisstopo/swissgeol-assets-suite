import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import * as O from 'fp-ts/Option';
import * as actions from '../../state/asset-search/asset-search.actions';
import { AppStateWithAssetSearch, LoadingState } from '../../state/asset-search/asset-search.reducer';
import {
  selectAssetEditDetailVM,
  selectAssetSearchPageData,
  selectIsResultsOpen,
  selectSearchLoadingState,
} from '../../state/asset-search/asset-search.selector';

@Component({
  selector: 'asset-sg-asset-search-results',
  templateUrl: './asset-search-results.component.html',
  styleUrls: ['./asset-search-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetSearchResultsComponent {
  @Output() closeSearchResultsClicked = new EventEmitter<void>();
  @Output() assetMouseOver = new EventEmitter<O.Option<number>>();

  protected readonly COLUMNS = [
    'favourites',
    'titlePublic',
    'assetFormat',
    'manCatLabel',
    'authors',
    'initiators',
    'createDate',
  ];

  private _store = inject(Store<AppStateWithAssetSearch>);
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);
  public isResultsOpen$ = this._store.select(selectIsResultsOpen);
  public assets$ = this._store.select(selectAssetEditDetailVM);
  public loadingState = this._store.select(selectSearchLoadingState);
  public pageStats$ = this._store.select(selectAssetSearchPageData);

  public onAssetMouseOver(assetId: number) {
    this.assetMouseOver.emit(O.some(assetId));
  }

  protected readonly LoadingState = LoadingState;

  public onAssetMouseOut() {
    this.assetMouseOver.emit(O.none);
  }

  public searchForAsset(assetId: number) {
    this._store.dispatch(actions.searchForAssetDetail({ assetId }));
  }

  public toggleResultsOpen(isCurrentlyOpen: boolean) {
    if (isCurrentlyOpen) {
      this._store.dispatch(actions.closeResults());
    } else {
      this._store.dispatch(actions.openResults());
    }
  }
}
