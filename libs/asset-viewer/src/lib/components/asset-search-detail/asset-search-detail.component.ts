import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { AppState } from '@asset-sg/client-shared';
import { AssetFile } from '@asset-sg/shared';
import { Store } from '@ngrx/store';

import * as actions from '../../state/asset-search/asset-search.actions';
import { LoadingState } from '../../state/asset-search/asset-search.reducer';
import {
  selectAssetDetailLoadingState,
  selectCurrentAssetDetailVM,
} from '../../state/asset-search/asset-search.selector';

@Component({
  selector: 'asset-sg-asset-search-detail',
  templateUrl: './asset-search-detail.component.html',
  styleUrls: ['./asset-search-detail.component.scss'],
})
export class AssetSearchDetailComponent {
  private _store = inject(Store<AppState>);
  public readonly assetDetail$ = this._store.select(selectCurrentAssetDetailVM);
  public loadingState = this._store.select(selectAssetDetailLoadingState);

  public readonly activeFileDownloads = new Map<number, { isDownload: boolean }>();

  public resetAssetDetail() {
    this._store.dispatch(actions.resetAssetDetail());
  }

  protected readonly LoadingState = LoadingState;

  constructor(private httpClient: HttpClient) {}

  isActiveFileDownload(file: Omit<AssetFile, 'fileSize'>, isDownload = true): boolean {
    const download = this.activeFileDownloads.get(file.fileId);
    return download != null && download.isDownload == isDownload;
  }

  downloadFile(file: Omit<AssetFile, 'fileSize'>, isDownload = true): void {
    this.activeFileDownloads.set(file.fileId, { isDownload });
    this.httpClient.get(`/api/file/${file.fileId}`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');

        anchor.setAttribute('style', 'display: none');
        anchor.href = url;
        anchor.rel = 'noopener noreferrer';
        if (isDownload) {
          anchor.download = file.fileName;
        } else {
          anchor.target = '_blank';
        }
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        });
      },
      complete: () => {
        this.activeFileDownloads.delete(file.fileId);
      },
    });
  }
}
