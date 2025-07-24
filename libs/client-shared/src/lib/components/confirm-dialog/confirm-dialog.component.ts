import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { LetModule } from '@rx-angular/template/let';
import { ButtonComponent } from '../button';

@Component({
  selector: 'asset-sg-disclaimer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    FormsModule,
    MatDialogActions,
    MatDialogContent,
    ReactiveFormsModule,
    TranslateModule,
    LetModule,
  ],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {
  constructor(
    private readonly dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: ConfirmDialogData,
  ) {}

  public close(confirmed: boolean) {
    this.dialogRef.close(confirmed);
  }
}

export interface ConfirmDialogData {
  text: string;
  confirm: string;
  isSaveDisabled?: boolean;
}
