import { Component, input, output } from '@angular/core';
import { SgcButton, SgcIcon } from '@swissgeol/ui-core-angular';

@Component({
  selector: 'asset-sg-pdf-viewer-rotate',
  templateUrl: './pdf-viewer-rotate.component.html',
  styleUrl: './pdf-viewer-rotate.component.scss',
  imports: [SgcButton, SgcIcon],
})
export class PdfViewerRotateComponent {
  public readonly disableInteractions = input(false);
  public readonly rotateClockwise = output();

  protected handleRotateClockwise() {
    this.rotateClockwise.emit();
  }
}
