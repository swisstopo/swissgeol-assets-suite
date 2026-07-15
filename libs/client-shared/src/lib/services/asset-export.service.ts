import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AssetId } from '@asset-sg/shared/v2';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../components/confirm-dialog';
import { ExportDialogComponent, ExportDialogResult } from '../components/export-dialog';
import { triggerDownload } from '../utils/trigger-download';
import { LanguageService } from './language.service';

export const MAX_EXPORT_ASSETS = 100;

@Injectable({ providedIn: 'root' })
export class AssetExportService {
  private readonly httpClient = inject(HttpClient);
  private readonly dialogService = inject(MatDialog);
  private readonly languageService = inject(LanguageService);

  /**
   * Runs the full export flow for the given assets:
   * 1. If more than {@link MAX_EXPORT_ASSETS} are selected, ask the user to confirm and cap the selection.
   * 2. Let the user choose the export formats.
   * 3. Download the selected formats.
   */
  async export(assetIds: AssetId[]): Promise<void> {
    if (assetIds.length === 0) {
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

    if (result.csv) {
      await this.downloadCsv(ids);
    }
  }

  private async downloadCsv(assetIds: AssetId[]): Promise<void> {
    const language = this.languageService.language;
    const csv = await firstValueFrom(
      this.httpClient.post(`/api/assets/export/csv?lang=${language}`, { assetIds }, { responseType: 'text' }),
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    try {
      triggerDownload(url, true, formatCsvExportFilename(new Date()));
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/**
 * Builds the CSV export filename in the format `assets-export-YYYY-MM-DD-HH-mm-ss.csv`.
 */
export const formatCsvExportFilename = (date: Date): string => {
  const pad = (value: number): string => String(value).padStart(2, '0');
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const timePart = `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
  return `assets-export-${datePart}-${timePart}.csv`;
};
