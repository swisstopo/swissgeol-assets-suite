import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PdfOverlayComponent, PdfOverlayData } from './pdf-overlay.component';

@Injectable({ providedIn: 'root' })
export class PdfOverlayService {
  private readonly dialogService = inject(MatDialog);

  public openPdfOverlay(data: PdfOverlayData) {
    this.dialogService.open<PdfOverlayComponent, PdfOverlayData>(PdfOverlayComponent, {
      data,
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
    });
  }
}
