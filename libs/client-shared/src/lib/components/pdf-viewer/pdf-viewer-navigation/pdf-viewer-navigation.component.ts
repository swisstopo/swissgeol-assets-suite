import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
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
  public readonly goToPage = output<number>();
  protected readonly showError = signal(false);

  protected handleNavigate(action: PdfNavigationAction) {
    this.navigate.emit(action);
  }

  protected onPageInputSubmit(input: HTMLInputElement) {
    const trimmed = input.value.trim();
    const count = this.pageCount();
    const page = /^\d+$/.test(trimmed) ? Number.parseInt(trimmed, 10) : Number.NaN;
    input.blur();

    if (!Number.isNaN(page) && count != null && page >= 1 && page <= count) {
      input.value = page.toString();
      this.goToPage.emit(page);
    } else {
      this.showError.set(true);
      input.addEventListener(
        'animationend',
        () => {
          this.showError.set(false);
        },
        { once: true },
      );
    }
  }

  protected resetInputValue(input: HTMLInputElement) {
    const current = this.currentPage();
    input.value = current === undefined ? '' : current.toString();
  }
}
