import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { fromAppShared } from '@asset-sg/client-shared';
import { AssetEditDetail } from '@asset-sg/shared';
import { AssetContact, AssetContactRole, Contact } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { combineLatestWith, startWith, Subscription, tap } from 'rxjs';
import { AssetForm } from '../../asset-editor-page/asset-editor-page.component';
import { LinkContactDialogComponent } from './link-contact-dialog/link-contact-dialog.component';
import { ManageContactDialogComponent } from './manage-contact-dialog/manage-contact-dialog.component';

export type ContactWithRoles = Contact & { roles: AssetContactRole[] };

interface ContactItem {
  roles: ('author' | 'supplier' | 'initiator')[];
  name: string;
  id: number;
}

type TableColumns = keyof ContactItem | 'delete';

@Component({
  selector: 'asset-sg-editor-contacts',
  styleUrls: ['./asset-editor-contacts.component.scss'],
  templateUrl: './asset-editor-contacts.component.html',
  standalone: false,
})
export class AssetEditorContactsComponent implements OnInit, OnDestroy {
  @Input() public form!: AssetForm['controls']['contacts'];
  @Input() public asset: AssetEditDetail | null = null;
  protected readonly dataSource: MatTableDataSource<ContactItem> = new MatTableDataSource();
  protected readonly displayedColumns: TableColumns[] = ['name', 'roles', 'delete'];
  private readonly subscriptions: Subscription = new Subscription();
  private existingContacts: Record<string, Contact> = {};
  private readonly store = inject(Store);
  private readonly dialogService: MatDialog = inject(MatDialog);
  private readonly existingContacts$ = this.store.select(fromAppShared.selectContactItems);

  public ngOnInit() {
    this.subscriptions.add(
      this.existingContacts$
        .pipe(
          tap((contacts) => {
            if (contacts) {
              this.existingContacts = contacts;
            }
          }),
        )
        .subscribe(),
    );
    this.subscriptions.add(
      this.form.controls.assetContacts.valueChanges
        .pipe(
          startWith(this.form.controls.assetContacts.value),
          combineLatestWith(this.existingContacts$),
          tap(([assetContacts, contacts]) => {
            if (contacts) {
              // first we combine the asset contacts with the existing contacts and then group roles per contact
              this.dataSource.data = Object.values(
                assetContacts
                  .filter((contactMatch) => contacts[contactMatch.id])
                  .map((contactMatch) => {
                    const contact = contacts[contactMatch.id];
                    return {
                      role: contactMatch.role,
                      name: contact.name,
                      id: contact.id,
                    };
                  })
                  .reduce(
                    (acc, { id, name, role }) => {
                      if (!acc[id]) {
                        acc[id] = { id, name, roles: [] };
                      }
                      acc[id].roles.push(role);
                      return acc;
                    },
                    {} as Record<string, ContactItem>,
                  ),
              ).sort((a, b) => a.name.localeCompare(b.name));
            }
          }),
        )
        .subscribe(),
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  protected openLinkDialog() {
    const dialogRef = this.dialogService.open<LinkContactDialogComponent, undefined, AssetContact[]>(
      LinkContactDialogComponent,
      {
        width: '674px',
        restoreFocus: false,
      },
    );

    this.subscriptions.add(
      dialogRef.afterClosed().subscribe((assetContacts) => {
        this.handleAssetContactFormUpdate(assetContacts);
      }),
    );
  }

  protected openDetailDialog(contact: ContactItem) {
    const roles = this.dataSource.data.find((contactMatch) => contactMatch.id === contact.id);
    const existingContact: ContactWithRoles = { ...this.existingContacts[contact.id], roles: roles?.roles ?? [] };
    const dialogRef = this.dialogService.open<ManageContactDialogComponent, ContactWithRoles, AssetContact[]>(
      ManageContactDialogComponent,
      {
        width: '674px',
        restoreFocus: false,
        data: existingContact,
      },
    );

    this.subscriptions.add(
      dialogRef.afterClosed().subscribe((assetContacts) => {
        this.handleAssetContactFormUpdate(assetContacts, contact.id);
      }),
    );
  }

  protected removeContact(element: ContactItem) {
    this.form.controls.assetContacts.controls
      .filter((control) => control.value.id === element.id)
      .forEach((contact) => {
        const idx = this.form.controls.assetContacts.controls.findIndex(
          (control) => control.value.id === contact.value.id,
        );
        this.form.controls.assetContacts.removeAt(idx);
        this.form.markAsDirty();
      });
  }

  private handleAssetContactFormUpdate(assetContacts?: AssetContact[], contactId?: number) {
    if (assetContacts) {
      this.form.controls.assetContacts.controls = this.form.controls.assetContacts.controls.filter(
        (contact) => contact.value.id !== contactId,
      );
      assetContacts.forEach((assetContact) => {
        this.form.controls.assetContacts.push(new FormControl<AssetContact>(assetContact, { nonNullable: true }));
        this.form.markAsDirty();
      });
    }
  }
}
