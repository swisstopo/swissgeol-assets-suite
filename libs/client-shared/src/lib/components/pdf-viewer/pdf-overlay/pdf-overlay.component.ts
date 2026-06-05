import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { PdfViewerComponent } from '../pdf-viewer.component';
import { PdfViewerFile } from '../pdf-viewer.models';

export interface PdfOverlayData {
  assetId: number;
  assetPdfs: PdfViewerFile[];
  initialPdfId?: number;
  initialPageNumber?: number;
}
@Component({
  selector: 'asset-sg-pdf-overlay',
  imports: [MatDialogContent, PdfViewerComponent],
  templateUrl: './pdf-overlay.component.html',
  styleUrl: './pdf-overlay.component.scss',
})
export class PdfOverlayComponent {
  protected readonly data = inject<PdfOverlayData>(MAT_DIALOG_DATA);
  private readonly matDialogRef = inject(MatDialogRef);

  protected onClose() {
    this.matDialogRef.close();
  }
}
