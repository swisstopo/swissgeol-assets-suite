import { Component, Input, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { AssetEditDetail, ValueItem } from '@asset-sg/shared';

import * as actions from '../../../state/asset-search/asset-search.actions';
import { AppStateWithAssetSearch } from '../../../state/asset-search/asset-search.reducer';
import {
  FullContact,
  selectAssetFormatItem,
  selectAssetKindItem,
  selectContact,
  selectManCatLabelItem,
} from '../../../state/asset-search/asset-search.selector';

@Component({
  selector: 'asset-sg-asset-search-result',
  templateUrl: './asset-search-result.component.html',
  styleUrls: ['./asset-search-result.component.scss'],
})
export class AssetSearchResultComponent implements OnInit {
  @Input() asset!: AssetEditDetail;

  private _store = inject(Store<AppStateWithAssetSearch>);
  public contacts$!: Observable<FullContact[] | null>;
  public assetKindItem$!: Observable<ValueItem | null>;
  public assetFormatItem$!: Observable<ValueItem | null>;
  public manCatLabelRefs$!: Observable<ValueItem[] | null>;


  public ngOnInit() {
    this.contacts$ = this._store.select(selectContact(this.asset.assetContacts));
    this.assetKindItem$ = this._store.select(selectAssetKindItem(this.asset.assetKindItemCode));
    this.assetFormatItem$ = this._store.select(selectAssetFormatItem(this.asset.assetFormatItemCode));
    this.manCatLabelRefs$ = this._store.select(selectManCatLabelItem(this.asset.manCatLabelRefs));
  }

  public searchForAsset(assetId: number) {
    this._store.dispatch(actions.searchForAssetDetail({ assetId }));
  }
}




