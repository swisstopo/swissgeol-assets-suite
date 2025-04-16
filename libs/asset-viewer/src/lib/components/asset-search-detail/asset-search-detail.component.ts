import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { appSharedStateActions, can$, CURRENT_LANG } from '@asset-sg/client-shared';
import { AssetFileType } from '@asset-sg/shared';
import { AssetEditPolicy } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { map, Observable } from 'rxjs';
import { ViewerControllerService } from '../../services/viewer-controller.service';
import { AppStateWithAssetSearch } from '../../state/asset-search/asset-search.reducer';
import { AssetDetailFileVM, selectCurrentAssetDetailVM } from '../../state/asset-search/asset-search.selector';

@Component({
  selector: 'asset-sg-asset-search-detail',
  templateUrl: './asset-search-detail.component.html',
  styleUrls: ['./asset-search-detail.component.scss'],
  standalone: false,
})
export class AssetSearchDetailComponent {
  private readonly router = inject(Router);
  private readonly store = inject(Store<AppStateWithAssetSearch>);
  public readonly currentLang$ = inject(CURRENT_LANG);
  private readonly viewerControllerService = inject(ViewerControllerService);

  public readonly asset$ = this.store.select(selectCurrentAssetDetailVM);

  public readonly canUpdate$ = can$(AssetEditPolicy, this.asset$, (it, asset) => it.canUpdate(asset));

  public readonly filesByType$: Observable<Record<AssetFileType, AssetDetailFileVM[]>> = this.asset$.pipe(
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
    }),
  );

  public navigateToAssetEdit(lang: string | null, assetId: number) {
    this.router.navigate([lang, 'asset-admin', assetId]);
  }

  public clearSelectedAsset() {
    this.store.dispatch(appSharedStateActions.setCurrentAsset({ asset: null }));
  }

  public searchForReferenceAsset(assetId: number) {
    this.viewerControllerService.selectAsset(assetId);
  }
}
