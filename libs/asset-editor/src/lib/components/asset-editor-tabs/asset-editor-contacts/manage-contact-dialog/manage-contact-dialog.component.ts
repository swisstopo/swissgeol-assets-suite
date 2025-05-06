import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { appSharedStateActions, fromAppShared } from '@asset-sg/client-shared';
import { AssetContactRole } from '@asset-sg/shared';
import { AssetContact, AssetContactRoles, ContactData } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { map, Observable, Subscription, tap } from 'rxjs';
import { TranslatedValueItem } from '../../../../models/translated-value-item.interface';
import { AssetEditorService } from '../../../../services/asset-editor.service';
import { mapValueItemsToTranslatedItem } from '../../../../utils/map-value-items-to-translated-item.utils';
import { ContactWithRoles } from '../asset-editor-contacts.component';

@Component({
  selector: 'asset-sg-manage-contact-dialog',
  templateUrl: './manage-contact-dialog.component.html',
  styleUrls: ['./manage-contact-dialog.component.scss'],
  standalone: false,
})
export class ManageContactDialogComponent implements OnInit {
  @Output() public createContact: EventEmitter<AssetContact[]> = new EventEmitter();
  @Output() public closeDialog: EventEmitter<void> = new EventEmitter();
  @Input() public data: Partial<ContactWithRoles> | undefined;
  protected readonly roles = AssetContactRoles.map((role) => ({
    key: role,
    translation: { key: `contactRoles.${role}` },
  }));
  protected readonly manageContactForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: Validators.required }),
    roles: new FormControl<AssetContactRole[]>([], { nonNullable: true, validators: Validators.required }),
    street: new FormControl(''),
    houseNumber: new FormControl(''),
    plz: new FormControl(''),
    locality: new FormControl(''),
    country: new FormControl(''),
    telephone: new FormControl(''),
    email: new FormControl(''),
    website: new FormControl(''),
    contactKindItemCode: new FormControl('', { nonNullable: true }),
  });
  protected existingContactId: number | null = null;
  private readonly subscriptions: Subscription = new Subscription();
  private readonly assetEditorService: AssetEditorService = inject(AssetEditorService);
  private readonly store = inject(Store);
  protected readonly contactKindItems$: Observable<TranslatedValueItem[]> = this.store
    .select(fromAppShared.selectContactKindItems)
    .pipe(map(mapValueItemsToTranslatedItem));

  public ngOnInit() {
    if (this.data) {
      if (this.data.id) {
        this.existingContactId = this.data.id;
      }
      this.manageContactForm.patchValue(this.data);
    }
  }

  protected createOrUpdateContact() {
    const { roles, ...contactData } = this.manageContactForm.getRawValue();
    this.subscriptions.add(
      this.createOrSaveContact(contactData)
        .pipe(
          tap((res) => {
            const assetContacts = roles.map((role) => {
              return {
                id: res.id,
                role,
              } as AssetContact;
            });
            this.createContact.emit(assetContacts);
          }),
        )
        .subscribe(),
    );
  }

  protected cancel() {
    this.closeDialog.emit();
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
