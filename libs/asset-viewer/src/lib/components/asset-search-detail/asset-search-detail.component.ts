import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { ApiError } from '@asset-sg/client-shared';
import { ORD } from '@asset-sg/core';

import { AssetDetailVM } from '../../state/asset-viewer.selectors';

@Component({
    selector: 'asset-sg-asset-search-detail',
    templateUrl: './asset-search-detail.component.html',
    styleUrls: ['./asset-search-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetSearchDetailComponent {
    @Input() public rdAssetDetail$?: ORD.ObservableRemoteData<ApiError, AssetDetailVM>;
}
