import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AssetId, MAX_EXPORT_ASSETS } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { EmptyError, firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../components/confirm-dialog';
import { ExportDialogComponent, ExportDialogResult } from '../components/export-dialog';
import { showAlert } from '../state/alert/alert.actions';
import { AlertType } from '../state/alert/alert.model';
import { triggerDownload } from '../utils/trigger-download';
import { LanguageService } from './language.service';

@Injectable({ providedIn: 'root' })
export class AssetExportService {
  private readonly httpClient = inject(HttpClient);
  private readonly dialogService = inject(MatDialog);
  private readonly languageService = inject(LanguageService);
  private readonly store = inject(Store);
  private readonly translateService = inject(TranslateService);

  private readonly _isExporting = signal(false);

  readonly isExporting = this._isExporting.asReadonly();

  async export(assetIds: AssetId[]): Promise<void> {
    if (assetIds.length === 0 || this._isExporting()) {
      return;
    }

    let ids = assetIds;
    if (ids.length > MAX_EXPORT_ASSETS) {
      const hasConfirmed = await firstValueFrom(
        this.dialogService
          .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
            data: {
              text: 'export.maxSelectionWarning',
              confirm: 'export.exportFirstAssets',
            },
          })
          .afterClosed(),
      );
      if (!hasConfirmed) {
        return;
      }
      ids = ids.slice(0, MAX_EXPORT_ASSETS);
    }

    const result = await firstValueFrom(
      this.dialogService
        .open<ExportDialogComponent, unknown, ExportDialogResult>(ExportDialogComponent, {
          panelClass: 'export-dialog-panel',
        })
        .afterClosed(),
    );
    if (result == null) {
      return;
    }

    this._isExporting.set(true);
    try {
      if (result.csv) {
        await this.downloadCsv(ids);
      } else if (result.geopackage) {
        await this.downloadGeoPackage(ids);
      }
    } catch (error) {
      this.handleError(error);
    } finally {
      this._isExporting.set(false);
    }
  }

  private async downloadCsv(assetIds: AssetId[]): Promise<void> {
    const language = this.languageService.language;
    const csv = await firstValueFrom(
      this.httpClient.post(`/api/assets/export/csv?lang=${language}`, { assetIds }, { responseType: 'text' }),
    );
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), formatExportFilename(new Date(), 'csv'));
  }

  private async downloadGeoPackage(assetIds: AssetId[]): Promise<void> {
    const language = this.languageService.language;
    const geoPackage = await firstValueFrom(
      this.httpClient.post(`/api/assets/export/geopackage?lang=${language}`, { assetIds }, { responseType: 'blob' }),
    );
    downloadBlob(geoPackage, formatExportFilename(new Date(), 'gpkg'));
  }

  private handleError(error: unknown): void {
    if (error instanceof EmptyError) {
      return;
    }
    console.error('Asset export failed', error);
    this.store.dispatch(
      showAlert({
        alert: {
          id: 'asset-export-error',
          text: this.translateService.instant('export.error'),
          type: AlertType.Error,
          isPersistent: false,
        },
      }),
    );
  }
}

const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  try {
    triggerDownload(url, true, fileName);
  } finally {
    URL.revokeObjectURL(url);
  }
};

export const formatExportFilename = (date: Date, extension: 'csv' | 'gpkg' | 'zip'): string => {
  const pad = (value: number): string => String(value).padStart(2, '0');
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const timePart = `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
  return `assets-export-${datePart}-${timePart}.${extension}`;
};
