import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import * as O from 'fp-ts/Option';
import { Observable } from 'rxjs';

import { ObservableRemoteDataSearchAsset } from '../../models';
import { SearchAssetVM } from '../../state/asset-viewer.selectors';

@Component({
    selector: 'asset-sg-asset-search-results',
    templateUrl: './asset-search-results.component.html',
    styleUrls: ['./asset-search-results.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetSearchResultsComponent {
    @Input() rdAssets$?: ObservableRemoteDataSearchAsset<SearchAssetVM[]>;
    @Input() public currentAssetId$!: Observable<O.Option<number>>;
    @Output('closeSearchResultsClicked') closeSearchResultsClicked = new EventEmitter<void>();
    @Output('assetMouseOver') assetMouseOver$ = new EventEmitter<O.Option<number>>();

    public shownAssetId$!: Observable<number | null>;

    public onAssetMouseOver(assetId: number) {
        this.assetMouseOver$.emit(O.some(assetId));
    }

    public onAssetMouseOut() {
        this.assetMouseOver$.emit(O.none);
    }
}
