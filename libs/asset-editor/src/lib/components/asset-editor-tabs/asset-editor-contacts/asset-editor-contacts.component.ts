import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { fromAppShared } from '@asset-sg/client-shared';
import { isNotNull, isNotUndefined } from '@asset-sg/core';
import { Asset, AssetContact, AssetContactRole, Contact, ContactId } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { combineLatestWith, filter, startWith, Subscription, tap } from 'rxjs';
import { AssetForm } from '../../asset-editor-page/asset-editor-page.component';
import { DialogWrapperComponent } from './dialog-wrapper/dialog-wrapper.component';

export type ContactWithRoles = Contact & { roles: AssetContactRole[] };

interface ContactItem {
  roles: AssetContactRole[];
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
  @Input() public asset: Asset | null = null;

  protected readonly dataSource: MatTableDataSource<ContactItem> = new MatTableDataSource();
  protected readonly displayedColumns: TableColumns[] = ['name', 'roles', 'delete'];

  private existingContacts = new Map<ContactId, Contact>();
  private readonly subscriptions: Subscription = new Subscription();

  private readonly dialogService: MatDialog = inject(MatDialog);
  private readonly store = inject(Store);

  private readonly existingContacts$ = this.store.select(fromAppShared.selectReferenceContacts).pipe(filter(isNotNull));

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
      this.form.valueChanges
        .pipe(
          startWith(this.form.value),
          combineLatestWith(this.existingContacts$),
          tap(([assetContacts, contacts]) => {
            // first we combine the asset contacts with the existing contacts and then group roles per contact
            this.dataSource.data = Object.values(
              assetContacts
                .map((contact) => {
                  const reference = contacts.get(contact.id);
                  return reference && { ...contact, name: reference.name };
                })
                .filter(isNotUndefined)
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
          }),
        )
        .subscribe(),
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  protected openLinkDialog() {
    const dialogRef = this.dialogService.open<DialogWrapperComponent, undefined, AssetContact[]>(
      DialogWrapperComponent,
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
    const reference = this.existingContacts.get(contact.id);
    if (reference === undefined) {
      return;
    }
    const item = this.dataSource.data.find((contactMatch) => contactMatch.id === contact.id);
    const contactWithRoles: ContactWithRoles = { ...reference, roles: item?.roles ?? [] };
    const dialogRef = this.dialogService.open<DialogWrapperComponent, ContactWithRoles, AssetContact[]>(
      DialogWrapperComponent,
      {
        width: '674px',
        restoreFocus: false,
        data: contactWithRoles,
      },
    );

    this.subscriptions.add(
      dialogRef.afterClosed().subscribe((assetContacts) => {
        this.handleAssetContactFormUpdate(assetContacts);
      }),
    );
  }

  protected removeContact(event: Event, element: ContactItem) {
    event.stopPropagation();
    this.form.controls
      .map((control, idx) => ({ control, idx }))
      .filter(({ control }) => control.value.id === element.id)
      .map(({ idx }) => idx)
      .sort((a, b) => b - a)
      .forEach((idx) => {
        this.form.removeAt(idx);
      });

    this.form.markAsDirty();
  }

  private handleAssetContactFormUpdate(assetContacts?: AssetContact[]) {
    if (assetContacts === undefined || assetContacts.length === 0) {
      return;
    }
    const id = assetContacts[0].id;
    const controls = this.form.controls.filter((control) => control.value.id !== id);
    controls.push(...assetContacts.map((contact) => new FormControl(contact, { nonNullable: true })));
    this.form.controls = controls;

    this.form.markAsDirty();
    this.form.updateValueAndValidity();
  }
}
