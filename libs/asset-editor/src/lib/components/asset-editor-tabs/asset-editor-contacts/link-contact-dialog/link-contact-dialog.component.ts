import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { fromAppShared } from '@asset-sg/client-shared';
import { AssetContactRole } from '@asset-sg/shared';
import { AssetContact, AssetContactRoles, Contact, ContactId, ContactWithRole } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { combineLatestWith, debounceTime, Subject, Subscription, tap } from 'rxjs';
import { CreateContactDialogComponent } from '../create-contact-dialog/create-contact-dialog.component';

type AssetContactWithoutRole = Pick<Contact, 'name' | 'id'>;

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
    role: new FormControl<AssetContactRole | null>(null, { validators: Validators.required }),
  });
  protected readonly searchTerm$ = new Subject<string>();
  protected readonly filteredContacts$ = new Subject<AssetContactWithoutRole[]>();
  private readonly dialogRef = inject(MatDialogRef<LinkContactDialogComponent, AssetContact>);
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
              const filteredContacts: AssetContactWithoutRole[] = Object.values(contacts)
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
    // todo: this does currently not reset when changing the search term and _not_ selecting a contact
    this.searchTerm$.next(event);
  }

  protected setSelectedContact(contact: AssetContactWithoutRole) {
    this.linkContactForm.controls.linkedContact.setValue(contact.id);
  }

  protected linkContact() {
    this.dialogRef.close({
      id: this.linkContactForm.controls.linkedContact.value,
      role: this.linkContactForm.controls.role.value,
    } as AssetContact);
  }

  private linkNewContact(newContact: AssetContact) {
    console.log('linking ->', newContact);
    this.dialogRef.close(newContact);
  }

  protected cancel() {
    this.dialogRef.close();
  }

  protected createNewContact() {
    this.subscriptions.add(
      this.dialogService
        .open<CreateContactDialogComponent, Partial<ContactWithRole>, AssetContact>(CreateContactDialogComponent, {
          width: '674px',
          restoreFocus: false,
          enterAnimationDuration: '0ms',
          exitAnimationDuration: '0ms',
          data: {
            name: this.searchTerm ?? '',
            role: this.linkContactForm.value.role ?? undefined,
          },
        })
        .afterClosed()
        .pipe(
          tap((newContact) => {
            if (newContact) {
              console.log('linking');
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
