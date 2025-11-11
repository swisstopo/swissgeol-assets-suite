import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SgcButton, SgcIcon } from '@swissgeol/ui-core-angular';

@Component({
  selector: 'asset-sg-pdf-viewer-header',
  imports: [CommonModule, SgcButton, SgcIcon],
  templateUrl: './pdf-viewer-header.component.html',
  styleUrl: './pdf-viewer-header.component.scss',
})
export class PdfViewerHeaderComponent {
  @Input() public hideCloseButton = false;
  @Input() public hideDownloadButton = false;
  @Output() public readonly closeViewer = new EventEmitter<void>();
  @Output() public readonly downloadPdf = new EventEmitter<void>();

  protected onCloseClick() {
    this.closeViewer.emit();
  }

  protected onDownloadClick() {
    this.downloadPdf.emit();
  }
}
