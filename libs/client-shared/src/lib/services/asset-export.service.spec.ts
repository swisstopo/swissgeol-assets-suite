import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MAX_EXPORT_ASSETS } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, of } from 'rxjs';
import { ConfirmDialogComponent } from '../components/confirm-dialog';
import { ExportDialogComponent, ExportDialogResult } from '../components/export-dialog';
import { showAlert } from '../state/alert/alert.actions';
import { AlertType } from '../state/alert/alert.model';
import { triggerDownload } from '../utils/trigger-download';
import { AssetExportService, formatExportFilename } from './asset-export.service';
import { LanguageService } from './language.service';

jest.mock('../utils/trigger-download', () => ({ triggerDownload: jest.fn() }));
jest.mock('./language.service', () => ({ LanguageService: class {} }));

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('AssetExportService', () => {
  let service: AssetExportService;
  let http: HttpTestingController;
  let dialogMock: { open: jest.Mock };
  let storeMock: { dispatch: jest.Mock };
  let exportDialogResult: ExportDialogResult | undefined;
  let confirmDialogResult: boolean | undefined;

  const setup = (interceptors: HttpInterceptorFn[] = []) => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors(interceptors)),
        provideHttpClientTesting(),
        { provide: MatDialog, useValue: dialogMock },
        { provide: Store, useValue: storeMock },
        { provide: LanguageService, useValue: { language: 'de' } },
        { provide: TranslateService, useValue: { instant: (key: string) => `translated:${key}` } },
      ],
    });
    service = TestBed.inject(AssetExportService);
    http = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => {
    jest.useFakeTimers({
      now: new Date(2025, 0, 2, 3, 4, 5),
      doNotFake: ['setTimeout', 'clearTimeout', 'setImmediate', 'queueMicrotask', 'nextTick'],
    });
    exportDialogResult = { csv: false, geopackage: true };
    confirmDialogResult = true;
    dialogMock = {
      open: jest.fn((component) => ({
        afterClosed: () => of(component === ConfirmDialogComponent ? confirmDialogResult : exportDialogResult),
      })),
    };
    storeMock = { dispatch: jest.fn() };
    (triggerDownload as jest.Mock).mockClear();
    URL.createObjectURL = jest.fn(() => 'blob:export');
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    http?.verify();
    jest.useRealTimers();
  });

  it('downloads the GeoPackage of the selected assets', async () => {
    setup();
    const result = service.export([1, 2]);
    await flushPromises();
    expect(service.isExporting()).toBe(true);

    const request = http.expectOne('/api/assets/export/geopackage?lang=de');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ assetIds: [1, 2] });
    expect(request.request.responseType).toBe('blob');
    request.flush(new Blob(['gpkg']));
    await result;

    expect(dialogMock.open).toHaveBeenCalledTimes(1);
    expect(dialogMock.open).toHaveBeenCalledWith(ExportDialogComponent, expect.anything());
    expect(triggerDownload).toHaveBeenCalledWith('blob:export', true, 'assets-export-2025-01-02-03-04-05.gpkg');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:export');
    expect(service.isExporting()).toBe(false);
    expect(storeMock.dispatch).not.toHaveBeenCalled();
  });

  it('downloads the CSV of the selected assets', async () => {
    exportDialogResult = { csv: true, geopackage: false };
    setup();
    const result = service.export([1]);
    await flushPromises();

    const request = http.expectOne('/api/assets/export/csv?lang=de');
    expect(request.request.body).toEqual({ assetIds: [1] });
    expect(request.request.responseType).toBe('text');
    request.flush('a;b');
    await result;

    expect(triggerDownload).toHaveBeenCalledWith('blob:export', true, 'assets-export-2025-01-02-03-04-05.csv');
  });

  it('only triggers a single download', async () => {
    exportDialogResult = { csv: true, geopackage: true };
    setup();
    const result = service.export([1]);
    await flushPromises();

    http.expectOne('/api/assets/export/csv?lang=de').flush('a;b');
    await result;

    expect(triggerDownload).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the export dialog is cancelled', async () => {
    exportDialogResult = undefined;
    setup();
    await service.export([1]);

    expect(triggerDownload).not.toHaveBeenCalled();
  });

  it('asks for confirmation and exports only the first assets when too many are selected', async () => {
    setup();
    const ids = Array.from({ length: MAX_EXPORT_ASSETS + 5 }, (_, i) => i + 1);
    const result = service.export(ids);
    await flushPromises();

    expect(dialogMock.open).toHaveBeenCalledWith(ConfirmDialogComponent, expect.anything());
    const request = http.expectOne('/api/assets/export/geopackage?lang=de');
    expect(request.request.body).toEqual({ assetIds: ids.slice(0, MAX_EXPORT_ASSETS) });
    request.flush(new Blob(['gpkg']));
    await result;
  });

  it('does nothing when the confirmation for too many assets is declined', async () => {
    confirmDialogResult = false;
    setup();
    await service.export(Array.from({ length: MAX_EXPORT_ASSETS + 1 }, (_, i) => i + 1));

    expect(dialogMock.open).toHaveBeenCalledTimes(1);
    expect(dialogMock.open).toHaveBeenCalledWith(ConfirmDialogComponent, expect.anything());
  });

  it('shows an alert when the download fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    setup();
    const result = service.export([1]);
    await flushPromises();

    http
      .expectOne('/api/assets/export/geopackage?lang=de')
      .flush(new Blob(['{}']), { status: 400, statusText: 'Bad Request' });
    await result;

    expect(triggerDownload).not.toHaveBeenCalled();
    expect(service.isExporting()).toBe(false);
    expect(storeMock.dispatch).toHaveBeenCalledWith(
      showAlert({
        alert: {
          id: 'asset-export-error',
          text: 'translated:export.error',
          type: AlertType.Error,
          isPersistent: false,
        },
      }),
    );
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('does not show an additional alert when the interceptor has already handled the error', async () => {
    setup([() => EMPTY]);
    await service.export([1]);

    expect(triggerDownload).not.toHaveBeenCalled();
    expect(storeMock.dispatch).not.toHaveBeenCalled();
    expect(service.isExporting()).toBe(false);
  });
});

describe('formatExportFilename', () => {
  it('formats the local date with zero padding', () => {
    expect(formatExportFilename(new Date(2025, 8, 7, 6, 5, 4), 'gpkg')).toBe('assets-export-2025-09-07-06-05-04.gpkg');
    expect(formatExportFilename(new Date(2025, 11, 31, 23, 59, 58), 'csv')).toBe(
      'assets-export-2025-12-31-23-59-58.csv',
    );
  });
});
