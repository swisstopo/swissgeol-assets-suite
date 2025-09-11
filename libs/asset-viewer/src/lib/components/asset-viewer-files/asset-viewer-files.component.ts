import { HttpClient } from '@angular/common/http';
import { Component, inject, Input } from '@angular/core';
import { AlertType, AppState, FileNamePipe, LanguageService, showAlert } from '@asset-sg/client-shared';
import { AssetFile, AssetId } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';

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

  private readonly fileNamePipe = inject(FileNamePipe);

  private readonly store = inject(Store<AppState>);

  private readonly httpClient = inject(HttpClient);

  private readonly translateService = inject(TranslateService);
  private readonly languageService = inject(LanguageService);

  public readonly locale$ = this.languageService.locale$;

  public readonly activeFileDownloads = new Set<`${AssetId}/${number}/${DownloadType}`>();

  public isActiveFileDownload(file: Omit<AssetFile, 'fileSize'>, downloadType: DownloadType): boolean {
    return this.activeFileDownloads.has(`${this.assetId}/${file.id}/${downloadType}`);
  }

  public downloadFile(file: Omit<AssetFile, 'fileSize'>, downloadType: DownloadType): void {
    const key = `${this.assetId}/${file.id}/${downloadType}` as const;
    this.activeFileDownloads.add(key);
    this.httpClient
      .get(`/api/assets/${this.assetId}/files/${file.id}`, { responseType: 'blob' })
      .pipe(finalize(() => this.activeFileDownloads.delete(key)))
      .subscribe({
        next: async (blob) => {
          const isPdf = file.name.endsWith('.pdf');
          if (isPdf) {
            blob = await blob.arrayBuffer().then((buffer) => new Blob([buffer], { type: 'application/pdf' }));
          }
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');

          anchor.setAttribute('style', 'display: none');
          anchor.href = url;
          if (!isPdf || downloadType === 'save-file') {
            anchor.download = this.fileNamePipe.transform(file);
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
        error: (error) => {
          console.error('Download error', error);
          this.store.dispatch(
            showAlert({
              alert: {
                id: `download-error-${error.status}-${error.url}`,
                text: this.translateService.get('downloadFailed'),
                type: AlertType.Error,
                isPersistent: true,
              },
            }),
          );
        },
      });
  }
}

type DownloadType = 'save-file' | 'open-in-tab';
