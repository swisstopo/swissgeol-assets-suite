import { Component, inject } from '@angular/core';
import { AppState } from '@asset-sg/client-shared';
import { AssetFileType } from '@asset-sg/shared';
import { AssetEditPolicy } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { map, Observable } from 'rxjs';
import * as actions from '../../state/asset-search/asset-search.actions';
import { LoadingState } from '../../state/asset-search/asset-search.reducer';
import {
  AssetDetailFileVM,
  selectAssetDetailLoadingState,
  selectCurrentAssetDetailVM,
} from '../../state/asset-search/asset-search.selector';

@Component({
  selector: 'asset-sg-asset-search-detail',
  templateUrl: './asset-search-detail.component.html',
  styleUrls: ['./asset-search-detail.component.scss'],
})
export class AssetSearchDetailComponent {
  private readonly store = inject(Store<AppState>);

  public readonly assetDetail$ = this.store.select(selectCurrentAssetDetailVM);
  public readonly filesByType$: Observable<Record<AssetFileType, AssetDetailFileVM[]>> = this.assetDetail$.pipe(
    map((asset) => {
      const mapping: Record<AssetFileType, AssetDetailFileVM[]> = {
        Normal: [],
        Legal: [],
      };
      if (asset == null) {
        return mapping;
      }
      for (const file of asset.assetFiles) {
        mapping[file.type].push(file);
      }
      return mapping;
    })
  );

  public loadingState = this.store.select(selectAssetDetailLoadingState);

  public resetAssetDetail() {
    this.store.dispatch(actions.resetAssetDetail());
  }

  public searchForReferenceAsset(assetId: number) {
    this.store.dispatch(actions.assetClicked({ assetId }));
  }

  protected readonly LoadingState = LoadingState;
  protected readonly AssetEditPolicy = AssetEditPolicy;
}
