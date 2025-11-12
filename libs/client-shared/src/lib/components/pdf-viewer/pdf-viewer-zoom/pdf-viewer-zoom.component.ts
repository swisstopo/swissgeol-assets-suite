import { Component, input, output } from '@angular/core';
import { SgcButton, SgcIcon } from '@swissgeol/ui-core-angular';

export type PdfZoomAction = 'in' | 'out' | 'reset';
@Component({
  selector: 'asset-sg-pdf-viewer-zoom',
  templateUrl: './pdf-viewer-zoom.component.html',
  styleUrl: './pdf-viewer-zoom.component.scss',
  imports: [SgcButton, SgcIcon],
})
export class PdfViewerZoomComponent {
  public readonly disableInteractions = input.required<boolean>();
  public readonly isAtMinZoomLevel = input.required<boolean>();
  public readonly isAtMaxZoomLevel = input.required<boolean>();
  public readonly zoom = output<PdfZoomAction>();

  protected handleZoom(action: PdfZoomAction) {
    this.zoom.emit(action);
  }
}
