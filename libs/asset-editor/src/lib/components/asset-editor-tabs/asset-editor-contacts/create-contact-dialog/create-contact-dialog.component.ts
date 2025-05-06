import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { appSharedStateActions, fromAppShared } from '@asset-sg/client-shared';
import { AssetContactRole } from '@asset-sg/shared';
import { AssetContact, AssetContactRoles, ContactData, ContactWithRole } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { map, Observable, Subscription, tap } from 'rxjs';
import { TranslatedValueItem } from '../../../../models/translated-value-item.interface';
import { AssetEditorService } from '../../../../services/asset-editor.service';
import { mapValueItemsToTranslatedItem } from '../../asset-editor-general/asset-editor-general.component';

@Component({
  selector: 'asset-sg-create-contact-dialog',
  templateUrl: './create-contact-dialog.component.html',
  styleUrls: ['./create-contact-dialog.component.scss'],
  standalone: false,
})
export class CreateContactDialogComponent implements OnInit {
  protected readonly roles = AssetContactRoles.map((role) => ({
    key: role,
    translation: { key: `contactRoles.${role}` },
  }));
  protected readonly createContactForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: Validators.required }),
    role: new FormControl<AssetContactRole | null>(null, { nonNullable: true, validators: Validators.required }),
    street: new FormControl(''),
    houseNumber: new FormControl(''),
    plz: new FormControl(''),
    locality: new FormControl(''),
    country: new FormControl(''),
    telephone: new FormControl(''),
    email: new FormControl(''),
    website: new FormControl(''),
    contactKindItemCode: new FormControl('unknown', { nonNullable: true }),
  });
  protected existingContactId: number | null = null;
  private readonly dialogRef = inject(MatDialogRef<CreateContactDialogComponent, AssetContact>);
  private readonly subscriptions: Subscription = new Subscription();
  private readonly assetEditorService: AssetEditorService = inject(AssetEditorService);
  private readonly store = inject(Store);
  protected readonly contactKindItems$: Observable<TranslatedValueItem[]> = this.store
    .select(fromAppShared.selectContactKindItems)
    .pipe(map(mapValueItemsToTranslatedItem));
  private readonly data: Partial<ContactWithRole> = inject(MAT_DIALOG_DATA);

  public ngOnInit() {
    if (this.data) {
      if (this.data.id) {
        this.existingContactId = this.data.id;
      }
      this.createContactForm.patchValue(this.data);
    }
  }

  protected createContact() {
    const { role, ...contactData } = this.createContactForm.getRawValue();
    this.subscriptions.add(
      this.createOrSaveContact(contactData)
        .pipe(
          tap((res) => {
            this.close({ id: res.id, role: role as AssetContactRole });
          }),
        )
        .subscribe(),
    );
  }

  protected close(assetContact: AssetContact) {
    this.dialogRef.close(assetContact);
  }

  protected cancel() {
    this.dialogRef.close();
  }

  private createOrSaveContact(data: ContactData) {
    if (this.existingContactId) {
      return this.assetEditorService.updateContact(this.existingContactId, data).pipe(
        tap((data) => {
          this.store.dispatch(appSharedStateActions.editContactResult(data));
        }),
      );
    }
    return this.assetEditorService.createContact(data).pipe(
      tap((data) => {
        this.store.dispatch(appSharedStateActions.createContactResult(data));
      }),
    );
  }
}
