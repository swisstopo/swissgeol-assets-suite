import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { appSharedStateActions, fromAppShared } from '@asset-sg/client-shared';
import { isNotNull } from '@asset-sg/core';
import {
  AssetContact,
  AssetContactRole,
  Contact,
  ContactData,
  ContactKindCode,
  LocalizedItem,
} from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { filter, map, Observable, Subscription, tap } from 'rxjs';
import { AssetEditorService } from '../../../../services/asset-editor.service';
import { ContactWithRoles } from '../asset-editor-contacts.component';

@Component({
  selector: 'asset-sg-manage-contact-dialog',
  templateUrl: './manage-contact-dialog.component.html',
  styleUrls: ['./manage-contact-dialog.component.scss'],
  standalone: false,
})
export class ManageContactDialogComponent implements OnInit, OnDestroy {
  @Output() public createContact: EventEmitter<AssetContact[]> = new EventEmitter();
  @Output() public closeDialog: EventEmitter<void> = new EventEmitter();
  @Input() public data: Partial<ContactWithRoles> | undefined;
  protected readonly roles = Object.values(AssetContactRole).map((role) => ({
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
    kindCode: new FormControl<ContactKindCode>('' as ContactKindCode, { nonNullable: true }),
  });
  protected existingContactId: number | null = null;
  private readonly subscriptions: Subscription = new Subscription();
  private readonly assetEditorService: AssetEditorService = inject(AssetEditorService);
  private readonly store = inject(Store);
  protected readonly contactKindItems$: Observable<Array<LocalizedItem<ContactKindCode>>> = this.store
    .select(fromAppShared.selectReferenceContactKinds)
    .pipe(
      filter(isNotNull),
      map((it) => [...it.values()]),
    );

  public ngOnInit(): void {
    if (this.data) {
      if (this.data.id) {
        this.existingContactId = this.data.id;
      }
      this.manageContactForm.patchValue(this.data);
    }
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  protected createOrUpdateContact() {
    const { roles, ...contactData } = this.manageContactForm.getRawValue();
    this.createOrSaveContact(contactData).subscribe((res) => {
      const assetContacts = roles.map((role) => {
        return {
          id: res.id,
          role,
        } as AssetContact;
      });
      this.createContact.emit(assetContacts);
    });
  }

  protected cancel() {
    this.closeDialog.emit();
  }

  private createOrSaveContact(data: ContactData): Observable<Contact> {
    return (
      this.existingContactId
        ? this.assetEditorService.updateContact(this.existingContactId, data)
        : this.assetEditorService.createContact(data)
    ).pipe(
      tap((contact) => {
        this.store.dispatch(appSharedStateActions.storeContact({ contact }));
      }),
    );
  }
}
