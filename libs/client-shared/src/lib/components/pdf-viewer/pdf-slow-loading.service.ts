import { inject, Injectable, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm-dialog';
import { SLOW_LOADING_WARNING_DELAY_MS } from './pdf-viewer.models';

/**
 * Watches a single PDF loading attempt and, if the PDF is still not usable after
 * {@link SLOW_LOADING_WARNING_DELAY_MS}, shows a dialog recommending the user to
 * download the document instead.
 *
 * The service only coordinates the timer and the (existing) confirm dialog. It never
 * touches PDF.js loading: dismissing the dialog leaves the load running untouched, and
 * downloading is delegated back to the caller via the `onDownload` callback.
 */
@Injectable()
export class PdfSlowLoadingService implements OnDestroy {
  private readonly dialog = inject(MatDialog);

  private timer: ReturnType<typeof setTimeout> | null = null;
  private dialogRef: MatDialogRef<ConfirmDialogComponent, boolean> | null = null;
  private dialogSubscription: Subscription | null = null;

  /**
   * Starts (or restarts) the slow-loading watch for a single PDF load attempt.
   * Any previous timer, subscription or open dialog is torn down first so that only the
   * currently loading PDF can ever trigger the warning.
   */
  public beginLoading(onDownload: () => void): void {
    this.reset();
    this.timer = setTimeout(() => {
      this.timer = null;
      this.showDialog(onDownload);
    }, SLOW_LOADING_WARNING_DELAY_MS);
  }

  /**
   * Signals that the PDF has finished loading and is usable. Cancels the pending warning so it
   * can no longer appear and closes an already-visible dialog, since the recommendation to
   * download instead is no longer relevant once the PDF is ready.
   */
  public completeLoading(): void {
    this.reset();
  }

  /**
   * Fully tears down the timer, subscription and any open dialog. Used when a different PDF is
   * opened, the viewer is closed or the component is destroyed.
   */
  public reset(): void {
    this.clearTimer();
    this.dialogSubscription?.unsubscribe();
    this.dialogSubscription = null;
    this.dialogRef?.close();
    this.dialogRef = null;
  }

  public ngOnDestroy(): void {
    this.reset();
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private showDialog(onDownload: () => void): void {
    const data: ConfirmDialogData = {
      text: 'pdfSlowLoading',
      confirm: 'pdfSlowLoadingDownload',
    };
    this.dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
      data,
    });
    this.dialogSubscription = this.dialogRef.afterClosed().subscribe((confirmed) => {
      this.dialogSubscription = null;
      this.dialogRef = null;
      if (confirmed) {
        onDownload();
      }
    });
  }
}
