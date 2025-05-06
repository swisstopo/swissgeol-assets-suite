import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { fromAppShared } from '@asset-sg/client-shared';
import { AssetContactRole } from '@asset-sg/shared';
import { AssetContact, AssetContactRoles, Contact, ContactId } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { combineLatestWith, debounceTime, Subject, Subscription, tap } from 'rxjs';

type AssetContactWithoutRole = Pick<Contact, 'name' | 'id'>;

@Component({
  selector: 'asset-sg-link-contact-dialog',
  templateUrl: './link-contact-dialog.component.html',
  styleUrls: ['./link-contact-dialog.component.scss'],
  standalone: false,
})
export class LinkContactDialogComponent implements OnInit {
  protected roles = AssetContactRoles.map((role) => ({
    key: role,
    translation: { key: `contactRoles.${role}` },
  }));
  protected readonly linkContactForm = new FormGroup({
    linkedContact: new FormControl<ContactId | null>(null, { validators: Validators.required }),
    role: new FormControl<AssetContactRole | null>(null, { validators: Validators.required }),
  });
  protected searchTerm$ = new Subject<string>();
  protected filteredContacts$ = new Subject<AssetContactWithoutRole[]>();
  private readonly dialogRef = inject(MatDialogRef<LinkContactDialogComponent, AssetContact>);
  private readonly store = inject(Store);
  private subscriptions: Subscription = new Subscription();

  public ngOnInit() {
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

  protected cancel() {
    this.dialogRef.close();
  }
}
