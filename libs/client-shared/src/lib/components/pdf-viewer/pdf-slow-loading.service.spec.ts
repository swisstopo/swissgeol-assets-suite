import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { PdfSlowLoadingService } from './pdf-slow-loading.service';
import { SLOW_LOADING_WARNING_DELAY_MS } from './pdf-viewer.models';

describe('PdfSlowLoadingService', () => {
  let service: PdfSlowLoadingService;
  let afterClosed$: Subject<boolean | undefined>;
  let dialogRefMock: { afterClosed: jest.Mock; close: jest.Mock };
  let dialogMock: { open: jest.Mock };

  beforeEach(() => {
    afterClosed$ = new Subject<boolean | undefined>();
    dialogRefMock = {
      afterClosed: jest.fn().mockReturnValue(afterClosed$.asObservable()),
      close: jest.fn(() => afterClosed$.next(undefined)),
    };
    dialogMock = {
      open: jest.fn().mockReturnValue(dialogRefMock),
    };

    TestBed.configureTestingModule({
      providers: [PdfSlowLoadingService, { provide: MatDialog, useValue: dialogMock }],
    });

    service = TestBed.inject(PdfSlowLoadingService);
  });

  it('does not show the dialog when the PDF loads in less than 5 seconds', fakeAsync(() => {
    service.beginLoading(jest.fn());

    tick(SLOW_LOADING_WARNING_DELAY_MS - 1);
    service.completeLoading();
    tick(SLOW_LOADING_WARNING_DELAY_MS);

    expect(dialogMock.open).not.toHaveBeenCalled();
  }));

  it('shows the dialog when the PDF is still loading after 5 seconds', fakeAsync(() => {
    service.beginLoading(jest.fn());

    tick(SLOW_LOADING_WARNING_DELAY_MS);

    expect(dialogMock.open).toHaveBeenCalledTimes(1);
  }));

  it('does not trigger the download when the dialog is dismissed', fakeAsync(() => {
    const onDownload = jest.fn();
    service.beginLoading(onDownload);

    tick(SLOW_LOADING_WARNING_DELAY_MS);
    // User dismisses the dialog (confirmed === false).
    afterClosed$.next(false);

    expect(dialogMock.open).toHaveBeenCalledTimes(1);
    expect(onDownload).not.toHaveBeenCalled();
  }));

  it('triggers the download callback when the user clicks Download', fakeAsync(() => {
    const onDownload = jest.fn();
    service.beginLoading(onDownload);

    tick(SLOW_LOADING_WARNING_DELAY_MS);
    // User confirms the dialog (confirmed === true).
    afterClosed$.next(true);

    expect(onDownload).toHaveBeenCalledTimes(1);
  }));

  it('closes the open dialog without triggering a download when loading completes after the warning appeared', fakeAsync(() => {
    const onDownload = jest.fn();
    service.beginLoading(onDownload);

    tick(SLOW_LOADING_WARNING_DELAY_MS);
    expect(dialogMock.open).toHaveBeenCalledTimes(1);

    // The PDF finishes loading after the dialog was already shown.
    expect(() => service.completeLoading()).not.toThrow();

    // The now-irrelevant dialog is closed automatically and no download happens on its own.
    expect(dialogRefMock.close).toHaveBeenCalledTimes(1);
    expect(onDownload).not.toHaveBeenCalled();
  }));

  it('does not show the dialog when reset before the 5 second delay elapses', fakeAsync(() => {
    service.beginLoading(jest.fn());

    tick(SLOW_LOADING_WARNING_DELAY_MS - 1);
    // Viewer/component closed before the delay elapsed.
    service.reset();
    tick(SLOW_LOADING_WARNING_DELAY_MS);

    expect(dialogMock.open).not.toHaveBeenCalled();
  }));

  it('closes an open dialog and cancels the timer on reset', fakeAsync(() => {
    service.beginLoading(jest.fn());
    tick(SLOW_LOADING_WARNING_DELAY_MS);
    expect(dialogMock.open).toHaveBeenCalledTimes(1);

    service.reset();

    expect(dialogRefMock.close).toHaveBeenCalledTimes(1);
  }));

  it('restarts the watch when a different PDF is loaded', fakeAsync(() => {
    service.beginLoading(jest.fn());
    tick(SLOW_LOADING_WARNING_DELAY_MS);
    expect(dialogMock.open).toHaveBeenCalledTimes(1);

    // Opening a different PDF closes the previous dialog and starts a fresh timer.
    service.beginLoading(jest.fn());
    expect(dialogRefMock.close).toHaveBeenCalledTimes(1);

    tick(SLOW_LOADING_WARNING_DELAY_MS);
    expect(dialogMock.open).toHaveBeenCalledTimes(2);
  }));
});
