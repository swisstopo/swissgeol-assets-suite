import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { SgcButton, SgcIcon } from '@swissgeol/ui-core-angular';

export type PdfNavigationAction = 'next' | 'previous' | 'start' | 'end';
@Component({
  selector: 'asset-sg-pdf-viewer-navigation',
  imports: [CommonModule, SgcButton, SgcIcon],
  templateUrl: './pdf-viewer-navigation.component.html',
  styleUrl: './pdf-viewer-navigation.component.scss',
})
export class PdfViewerNavigationComponent {
  public readonly currentPage = input<number | undefined>();
  public readonly pageCount = input<number | undefined>();
  public readonly disableInteractions = input(false);
  public readonly navigate = output<PdfNavigationAction>();

  protected handleNavigate(action: PdfNavigationAction) {
    this.navigate.emit(action);
  }
}
