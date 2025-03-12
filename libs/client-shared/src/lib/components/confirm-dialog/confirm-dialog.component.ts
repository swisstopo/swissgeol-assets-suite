import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, Output } from '@angular/core';
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
