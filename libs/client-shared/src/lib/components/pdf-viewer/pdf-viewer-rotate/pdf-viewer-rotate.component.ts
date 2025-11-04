import { Component, Input } from '@angular/core';
import { SgcButton, SgcIcon } from '@swissgeol/ui-core-angular';

@Component({
  selector: 'asset-sg-pdf-viewer-rotate',
  templateUrl: './pdf-viewer-rotate.component.html',
  styleUrl: './pdf-viewer-rotate.component.scss',
  imports: [SgcButton, SgcIcon],
})
export class PdfViewerRotateComponent {
  @Input() public disableInteractions = false;
}
