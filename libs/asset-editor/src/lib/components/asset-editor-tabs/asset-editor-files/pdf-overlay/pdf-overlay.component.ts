import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent } from '@angular/material/dialog';
import { PdfViewerComponent } from '@asset-sg/client-shared';

export interface PdfOverlayData {
  assetId: number;
  pdfId: number;
}
@Component({
  selector: 'asset-sg-pdf-overlay',
  imports: [PdfViewerComponent, MatDialogContent],
  templateUrl: './pdf-overlay.component.html',
  styleUrl: './pdf-overlay.component.scss',
})
export class PdfOverlayComponent {
  protected readonly data = inject<PdfOverlayData>(MAT_DIALOG_DATA);
}
