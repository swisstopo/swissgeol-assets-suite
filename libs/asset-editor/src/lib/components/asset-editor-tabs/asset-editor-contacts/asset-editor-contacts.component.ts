import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { fromAppShared } from '@asset-sg/client-shared';
import { AssetEditDetail } from '@asset-sg/shared';
import { AssetContact, Contact, ContactWithRole } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { combineLatestWith, startWith, Subscription, tap } from 'rxjs';
import { AssetForm } from '../../asset-editor-page/asset-editor-page.component';
import { CreateContactDialogComponent } from './create-contact-dialog/create-contact-dialog.component';
import { LinkContactDialogComponent } from './link-contact-dialog/link-contact-dialog.component';

interface ContactItem {
  role: 'author' | 'supplier' | 'initiator';
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
  protected readonly displayedColumns: TableColumns[] = ['name', 'role', 'delete'];
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
              this.dataSource.data = assetContacts
                .filter((contactMatch) => contacts[contactMatch.id])
                .map((contactMatch) => {
                  const contact = contacts[contactMatch.id];
                  return {
                    role: contactMatch.role,
                    name: contact.name,
                    id: contact.id,
                  };
                })
                .sort((a, b) => a.name.localeCompare(b.name));
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
    const dialogRef = this.dialogService.open<LinkContactDialogComponent, undefined, AssetContact>(
      LinkContactDialogComponent,
      {
        width: '674px',
        restoreFocus: false,
      },
    );

    this.subscriptions.add(
      dialogRef.afterClosed().subscribe((assetContact) => {
        if (assetContact) {
          this.form.controls.assetContacts.push(new FormControl<AssetContact>(assetContact, { nonNullable: true }));
          this.form.markAsDirty();
        }
      }),
    );
  }

  protected openDetailDialog(contact: ContactItem) {
    const existingContact: AssetContact & Contact = { ...this.existingContacts[contact.id], role: 'author' };
    const dialogRef = this.dialogService.open<CreateContactDialogComponent, ContactWithRole, AssetContact>(
      CreateContactDialogComponent,
      {
        width: '674px',
        restoreFocus: false,
        data: existingContact,
      },
    );

    this.subscriptions.add(
      dialogRef.afterClosed().subscribe((assetContact) => {
        if (assetContact) {
          this.form.controls.assetContacts.push(new FormControl<AssetContact>(assetContact, { nonNullable: true }));
          this.form.markAsDirty();
        }
      }),
    );
  }

  protected removeContact(element: ContactItem) {
    const idx = this.form.controls.assetContacts.controls.findIndex((control) => control.value.id === element.id);
    this.form.controls.assetContacts.removeAt(idx);
    this.form.markAsDirty();
  }
}
