import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { HttpClient } from '@angular/common/http';
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { AlertType, AppState, FileNamePipe, fromAppShared, showAlert } from '@asset-sg/client-shared';
import { AssetId, AssetFile } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { finalize, Subscription } from 'rxjs';

@Component({
  selector: 'ul[asset-sg-asset-viewer-files]',
  templateUrl: './asset-viewer-files.component.html',
  styleUrls: ['./asset-viewer-files.component.scss'],
  standalone: false,
})
export class AssetViewerFilesComponent implements OnInit, OnDestroy {
  @Input({ required: true })
  assetId!: AssetId;

  @Input({ required: true })
  files!: AssetFile[];

  @Input({ transform: coerceBooleanProperty })
  isLegal = false;

  private readonly fileNamePipe = inject(FileNamePipe);

  private readonly store = inject(Store<AppState>);

  private readonly httpClient = inject(HttpClient);

  private readonly translateService = inject(TranslateService);

  public locale!: string;

  public readonly activeFileDownloads = new Set<`${AssetId}/${number}/${DownloadType}`>();

  private readonly subscriptions = new Subscription();

  ngOnInit(): void {
    this.subscriptions.add(
      this.store.select(fromAppShared.selectLocale).subscribe((locale) => {
        this.locale = locale;
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get isNormal(): boolean {
    return !this.isLegal;
  }

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
