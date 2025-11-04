import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SgcButton, SgcIcon } from '@swissgeol/ui-core-angular';

export type PdfZoomAction = 'in' | 'out' | 'reset';
@Component({
  selector: 'asset-sg-pdf-viewer-zoom',
  templateUrl: './pdf-viewer-zoom.component.html',
  styleUrl: './pdf-viewer-zoom.component.scss',
  imports: [SgcButton, SgcIcon],
})
export class PdfViewerZoomComponent {
  @Input({ required: true }) public disableInteractions = false;
  @Input({ required: true }) isAtMinZoomLevel = false;
  @Input({ required: true }) isAtMaxZoomLevel = false;
  @Output() public zoom = new EventEmitter<PdfZoomAction>();

  protected handleZoom(action: PdfZoomAction) {
    this.zoom.emit(action);
  }
}
