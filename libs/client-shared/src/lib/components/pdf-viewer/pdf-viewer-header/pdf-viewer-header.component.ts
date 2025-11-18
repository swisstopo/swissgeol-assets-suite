import { CommonModule } from '@angular/common';
import { Component, input, model, output } from '@angular/core';
import { SgcButton, SgcIcon, SgcSelect } from '@swissgeol/ui-core-angular';
import { PdfViewerFile } from '../pdf-viewer.component';

@Component({
  selector: 'asset-sg-pdf-viewer-header',
  imports: [CommonModule, SgcButton, SgcIcon, SgcSelect],
  templateUrl: './pdf-viewer-header.component.html',
  styleUrl: './pdf-viewer-header.component.scss',
})
export class PdfViewerHeaderComponent {
  public readonly assetPdfs = input.required<PdfViewerFile[]>();
  public readonly selectedPdf = model<PdfViewerFile | undefined>(undefined);
  public readonly hideCloseButton = input(false);
  public readonly hideDownloadButton = input(false);
  public readonly hidePdfSelection = input(false);
  public readonly closeViewer = output<void>();
  public readonly downloadPdf = output<void>();

  protected onCloseClick() {
    this.closeViewer.emit();
  }

  protected onDownloadClick() {
    this.downloadPdf.emit();
  }

  protected changePdf($event: CustomEvent) {
    this.selectedPdf.set(this.assetPdfs().find((pdf) => pdf.id === $event.detail[0]));
  }
}
