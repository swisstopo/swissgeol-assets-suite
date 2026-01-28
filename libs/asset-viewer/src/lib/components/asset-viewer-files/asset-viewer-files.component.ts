import { HttpClient } from '@angular/common/http';
import { Component, inject, input } from '@angular/core';
import { LanguageService, PdfOverlayService, triggerDownload } from '@asset-sg/client-shared';
import { AssetFile, AssetFileSignedUrl, AssetId } from '@asset-sg/shared/v2';

@Component({
  selector: 'asset-sg-asset-viewer-files',
  templateUrl: './asset-viewer-files.component.html',
  styleUrls: ['./asset-viewer-files.component.scss'],
  standalone: false,
})
export class AssetViewerFilesComponent {
  public readonly assetId = input.required<AssetId>();
  public readonly files = input.required<AssetFile[]>();
  private readonly httpClient = inject(HttpClient);
  private readonly languageService = inject(LanguageService);
  public readonly locale$ = this.languageService.locale$;
  private readonly pdfOverlayService = inject(PdfOverlayService);

  public downloadFile(file: Omit<AssetFile, 'fileSize'>, downloadType: DownloadType): void {
    let presignUrl = `/api/assets/${this.assetId()}/files/${file.id}/presigned`;
    if (downloadType === 'save-file') {
      presignUrl += '?download=true';
    }

    this.httpClient.get<AssetFileSignedUrl>(presignUrl).subscribe(({ url }) => {
      triggerDownload(url, downloadType === 'save-file');
    });
  }

  protected openPdf(file: AssetFile, initialPageNumber?: number): void {
    this.pdfOverlayService.openPdfOverlay({
      assetId: this.assetId(),
      initialPdfId: file.id,
      initialPageNumber: initialPageNumber,
      assetPdfs: this.files()
        .filter((f) => f.name.endsWith('.pdf'))
        .map((f) => ({
          id: f.id,
          fileName: f.alias ?? f.name,
          pageRangeClassifications: f.pageRangeClassifications,
        })),
    });
  }
}

type DownloadType = 'save-file' | 'open-in-tab';
