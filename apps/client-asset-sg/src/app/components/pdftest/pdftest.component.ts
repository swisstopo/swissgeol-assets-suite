import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgxExtendedPdfViewerModule, pdfDefaultOptions } from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'asset-sg-pdftest',
  imports: [CommonModule, NgxExtendedPdfViewerModule],
  templateUrl: './pdftest.component.html',
  styleUrl: './pdftest.component.scss',
})
export class PdftestComponent {
  constructor() {
    pdfDefaultOptions.disableAutoFetch = true;
    pdfDefaultOptions.disableStream = true;
  }
}
