import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { fromAppShared } from '@asset-sg/client-shared';
import { AssetContactRole } from '@asset-sg/shared';
import { AssetContact, AssetContactRoles, Contact, ContactId } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { combineLatestWith, debounceTime, Subject, Subscription, tap } from 'rxjs';
import { ContactWithRoles } from '../asset-editor-contacts.component';
import { ManageContactDialogComponent } from '../manage-contact-dialog/manage-contact-dialog.component';

type SelectableContact = Pick<Contact, 'name' | 'id'>;

@Component({
  selector: 'asset-sg-link-contact-dialog',
  templateUrl: './link-contact-dialog.component.html',
  styleUrls: ['./link-contact-dialog.component.scss'],
  standalone: false,
})
export class LinkContactDialogComponent implements OnInit {
  protected readonly roles = AssetContactRoles.map((role) => ({
    key: role,
    translation: { key: `contactRoles.${role}` },
  }));
  protected readonly linkContactForm = new FormGroup({
    linkedContact: new FormControl<ContactId | null>(null, { validators: Validators.required }),
    roles: new FormControl<AssetContactRole[]>([], { nonNullable: true, validators: Validators.required }),
  });
  protected readonly searchTerm$ = new Subject<string>();
  protected readonly filteredContacts$ = new Subject<SelectableContact[]>();
  private readonly dialogRef = inject(MatDialogRef<LinkContactDialogComponent, AssetContact[]>);
  private readonly store = inject(Store);
  private readonly subscriptions: Subscription = new Subscription();
  private readonly dialogService = inject(MatDialog);
  private searchTerm = '';

  public ngOnInit() {
    this.subscriptions.add(this.searchTerm$.pipe(tap((searchTerm) => (this.searchTerm = searchTerm))).subscribe());
    this.subscriptions.add(
      this.searchTerm$
        .pipe(
          debounceTime(300),
          combineLatestWith(this.store.select(fromAppShared.selectContactItems)),
          tap(([searchTerm, contacts]) => {
            if (contacts) {
              const filteredContacts: SelectableContact[] = Object.values(contacts)
                .filter((contact) => contact.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((contact) => ({
                  id: contact.id,
                  name: contact.name,
                }));
              this.filteredContacts$.next(filteredContacts);
            }
          }),
        )
        .subscribe(),
    );
  }

  protected inputChange(event: string) {
    this.searchTerm$.next(event);
  }

  protected setSelectedContact(contact: SelectableContact) {
    this.linkContactForm.controls.linkedContact.setValue(contact.id);
  }

  protected linkContact() {
    const assetContacts = this.linkContactForm.controls.roles.value.map((role) => {
      return {
        id: this.linkContactForm.controls.linkedContact.value,
        role,
      } as AssetContact;
    });
    this.dialogRef.close(assetContacts);
  }

  private linkNewContact(newContact: AssetContact) {
    this.dialogRef.close(newContact);
  }

  protected cancel() {
    this.dialogRef.close();
  }

  protected createNewContact() {
    this.subscriptions.add(
      this.dialogService
        .open<ManageContactDialogComponent, Partial<ContactWithRoles>, AssetContact>(ManageContactDialogComponent, {
          width: '674px',
          restoreFocus: false,
          enterAnimationDuration: '0ms',
          exitAnimationDuration: '0ms',
          data: {
            name: this.searchTerm ?? '',
            roles: this.linkContactForm.value.roles,
          },
        })
        .afterClosed()
        .pipe(
          tap((newContact) => {
            if (newContact) {
              this.linkNewContact(newContact);
            } else {
              this.cancel();
            }
          }),
        )
        .subscribe(),
    );
  }
}
