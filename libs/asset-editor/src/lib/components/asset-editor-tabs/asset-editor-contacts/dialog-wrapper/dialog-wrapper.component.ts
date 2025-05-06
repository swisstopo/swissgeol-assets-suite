import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AssetContact } from '@asset-sg/shared/v2';
import { ContactWithRoles } from '../asset-editor-contacts.component';

@Component({
  selector: 'asset-sg-dialog-wrapper',
  templateUrl: './dialog-wrapper.component.html',
  styleUrls: ['./dialog-wrapper.component.scss'],
  standalone: false,
})
export class DialogWrapperComponent implements OnInit {
  protected mode: 'link' | 'manage' = 'link';
  protected data: Partial<ContactWithRoles> | undefined = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<DialogWrapperComponent, AssetContact[]>);

  public ngOnInit() {
    this.mode = this.data ? 'manage' : 'link';
  }

  protected handleClose(assetContacts?: AssetContact[]) {
    this.dialogRef.close(assetContacts);
  }

  protected switchToCreateMode(partialContact: Partial<Pick<ContactWithRoles, 'roles' | 'name'>>) {
    this.data = partialContact;
    this.mode = 'manage';
  }
}
