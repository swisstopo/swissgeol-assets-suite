import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../button';

@Component({
  selector: 'asset-sg-disclaimer-dialog',
  standalone: true,
  imports: [ButtonComponent, FormsModule, MatDialogActions, MatDialogContent, ReactiveFormsModule, TranslateModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {
  private readonly dialogRef: MatDialogRef<ConfirmDialogComponent> = inject(MatDialogRef);
  protected readonly data: ConfirmDialogData = inject(MAT_DIALOG_DATA);

  public close(confirmed: boolean) {
    this.dialogRef.close(confirmed);
  }
}

export interface ConfirmDialogData {
  text: string;
  confirm: string;
  isSaveDisabled?: boolean;
}
