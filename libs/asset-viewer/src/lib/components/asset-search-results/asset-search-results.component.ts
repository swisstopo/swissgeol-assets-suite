import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import * as O from 'fp-ts/Option';
import { Observable } from 'rxjs';
import * as actions from '../../state/asset-search/asset-search.actions';
import { AppStateWithAssetSearch, LoadingState } from '../../state/asset-search/asset-search.reducer';


import { AssetEditDetail } from '@asset-sg/shared';
import {
    selectAssetSearchPageData,
    selectAssetSearchResultData,
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

    private _store = inject(Store<AppStateWithAssetSearch>);
    public isResultsOpen$ = this._store.select(selectIsResultsOpen);
    public assets$: Observable<AssetEditDetail[]> = this._store.select(selectAssetSearchResultData);
    public loadingState = this._store.select(selectSearchLoadingState);
    public pageStats$ = this._store.select(selectAssetSearchPageData);

    public onAssetMouseOver(assetId: number) {
        this.assetMouseOver.emit(O.some(assetId));
    }

    protected readonly LoadingState = LoadingState;

    public onAssetMouseOut() {
        this.assetMouseOver.emit(O.none);
    }

    public toggleResultsOpen(isCurrentlyOpen: boolean) {
        if (isCurrentlyOpen) {
            this._store.dispatch(actions.closeResults());
        } else {
            this._store.dispatch(actions.openResults());
        }
    }
}
