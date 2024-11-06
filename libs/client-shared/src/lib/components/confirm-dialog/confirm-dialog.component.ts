import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatOption } from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
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
    MatError,
    MatFormField,
    MatLabel,
    MatOption,
    MatSelect,
    ReactiveFormsModule,
    TranslateModule,
    MatDivider,
    LetModule,
  ],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  @Output() public confirmEvent = new EventEmitter<void>();

  constructor(
    private readonly dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      text: string;
    }
  ) {}

  public close() {
    this.dialogRef.close();
  }

  public confirm() {
    this.confirmEvent.emit();
  }
}
