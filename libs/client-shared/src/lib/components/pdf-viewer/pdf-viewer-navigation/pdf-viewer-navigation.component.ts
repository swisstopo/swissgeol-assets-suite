import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SgcButton, SgcIcon } from '@swissgeol/ui-core-angular';

export type PdfNavigationAction = 'next' | 'previous' | 'start' | 'end';
@Component({
  selector: 'asset-sg-pdf-viewer-navigation',
  imports: [CommonModule, SgcButton, SgcIcon],
  templateUrl: './pdf-viewer-navigation.component.html',
  styleUrl: './pdf-viewer-navigation.component.scss',
})
export class PdfViewerNavigationComponent {
  @Input() public currentPage?: number = undefined;
  @Input() public pageCount?: number = undefined;
  @Input() public disableInteractions = false;
  @Output() public navigate = new EventEmitter<PdfNavigationAction>();

  protected handleNavigate(action: PdfNavigationAction) {
    this.navigate.emit(action);
  }
}
