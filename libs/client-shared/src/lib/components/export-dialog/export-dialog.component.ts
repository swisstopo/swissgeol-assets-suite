import { Component, inject, ViewEncapsulation } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../button';

export interface ExportDialogResult {
  csv: boolean;
}

interface ExportFormatOption {
  id: keyof ExportDialogResult | 'files' | 'geopackage';
  labelKey: string;
  hintKey?: string;
  disabled: boolean;
  selected: boolean;
}

@Component({
  selector: 'asset-sg-export-dialog',
  standalone: true,
  imports: [ButtonComponent, MatCheckboxModule, MatDialogActions, MatDialogContent, MatDialogTitle, TranslateModule],
  templateUrl: './export-dialog.component.html',
  styleUrls: ['./export-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ExportDialogComponent {
  private readonly dialogRef: MatDialogRef<ExportDialogComponent, ExportDialogResult> = inject(MatDialogRef);

  protected readonly options: ExportFormatOption[] = [
    { id: 'files', labelKey: 'export.formats.files', hintKey: 'export.comingSoon', disabled: true, selected: false },
    { id: 'csv', labelKey: 'export.formats.csv', disabled: false, selected: true },
    {
      id: 'geopackage',
      labelKey: 'export.formats.geopackage',
      hintKey: 'export.comingSoon',
      disabled: true,
      selected: false,
    },
  ];

  protected get isExportDisabled(): boolean {
    return !this.options.some((option) => !option.disabled && option.selected);
  }

  protected toggle(option: ExportFormatOption, checked: boolean): void {
    if (option.disabled) {
      return;
    }
    option.selected = checked;
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }

  protected confirm(): void {
    this.dialogRef.close({
      csv: this.options.find((option) => option.id === 'csv')?.selected ?? false,
    });
  }
}
