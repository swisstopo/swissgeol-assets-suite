import { Component, inject, ViewEncapsulation } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../button';

export interface ExportDialogResult {
  csv: boolean;
  geopackage: boolean;
}

type ExportFormatId = keyof ExportDialogResult | 'files';

/**
 * Formats that can't be selected together.
 * Combining them requires packaging them into a single ZIP archive, which is not supported yet.
 */
const MUTUALLY_EXCLUSIVE_FORMATS: ReadonlySet<ExportFormatId> = new Set(['csv', 'geopackage']);

interface ExportFormatOption {
  id: ExportFormatId;
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
    { id: 'geopackage', labelKey: 'export.formats.geopackage', disabled: false, selected: false },
  ];

  protected get isExportDisabled(): boolean {
    return !this.options.some((option) => !option.disabled && option.selected);
  }

  protected toggle(option: ExportFormatOption, checked: boolean): void {
    if (option.disabled) {
      return;
    }
    option.selected = checked;
    if (checked && MUTUALLY_EXCLUSIVE_FORMATS.has(option.id)) {
      for (const other of this.options) {
        if (other !== option && MUTUALLY_EXCLUSIVE_FORMATS.has(other.id)) {
          other.selected = false;
        }
      }
    }
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }

  protected confirm(): void {
    this.dialogRef.close({
      csv: this.isSelected('csv'),
      geopackage: this.isSelected('geopackage'),
    });
  }

  private isSelected(id: ExportFormatId): boolean {
    const option = this.options.find((it) => it.id === id);
    return option != null && !option.disabled && option.selected;
  }
}
