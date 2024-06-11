import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { map } from 'rxjs';

import { ApiError } from '@asset-sg/client-shared';
import { ORD } from '@asset-sg/core';
import { AssetFile } from '@asset-sg/shared';

import { AssetDetailVM } from '../../state/asset-viewer.selectors';

@Component({
  selector: 'asset-sg-asset-search-detail',
  templateUrl: './asset-search-detail.component.html',
  styleUrls: ['./asset-search-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetSearchDetailComponent {
  @Input() public rdAssetDetail$?: ORD.ObservableRemoteData<ApiError, AssetDetailVM>;

  constructor(private httpClient: HttpClient) {
  }

  downloadFile(file: Omit<AssetFile, 'fileSize'>, isDownload: boolean = true): void {
    this.httpClient.get(`/api/file/${file.fileId}`, { responseType: 'blob' }).subscribe((blob) => {
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
      })
    })
  }
}
