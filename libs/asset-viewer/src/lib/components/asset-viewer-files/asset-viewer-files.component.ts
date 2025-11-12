import { HttpClient } from '@angular/common/http';
import { Component, inject, Input } from '@angular/core';
import { LanguageService, triggerDownload } from '@asset-sg/client-shared';
import { AssetFile, AssetFileSignedUrl, AssetId } from '@asset-sg/shared/v2';

@Component({
  selector: 'asset-sg-asset-viewer-files',
  templateUrl: './asset-viewer-files.component.html',
  styleUrls: ['./asset-viewer-files.component.scss'],
  standalone: false,
})
export class AssetViewerFilesComponent {
  @Input({ required: true })
  assetId!: AssetId;
  @Input({ required: true })
  files!: AssetFile[];
  private readonly httpClient = inject(HttpClient);
  private readonly languageService = inject(LanguageService);
  public readonly locale$ = this.languageService.locale$;

  public downloadFile(file: Omit<AssetFile, 'fileSize'>, downloadType: DownloadType): void {
    let presignUrl = `/api/assets/${this.assetId}/files/${file.id}/presigned`;
    if (downloadType === 'save-file') {
      presignUrl += '?download=true';
    }

    this.httpClient.get<AssetFileSignedUrl>(presignUrl).subscribe(({ url }) => {
      triggerDownload(url, downloadType === 'save-file');
    });
  }
}

type DownloadType = 'save-file' | 'open-in-tab';
