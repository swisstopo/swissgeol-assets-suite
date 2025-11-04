import { Component, Input } from '@angular/core';
import { SgcButton, SgcIcon } from '@swissgeol/ui-core-angular';

@Component({
  selector: 'asset-sg-pdf-viewer-zoom',
  templateUrl: './pdf-viewer-zoom.component.html',
  styleUrl: './pdf-viewer-zoom.component.scss',
  imports: [SgcButton, SgcIcon],
})
export class PdfViewerZoomComponent {
  @Input() public disableInteractions = false;
}
