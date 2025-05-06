import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { fromAppShared } from '@asset-sg/client-shared';
import { AssetEditDetail } from '@asset-sg/shared';
import { AssetContact } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { combineLatestWith, startWith, Subscription, tap } from 'rxjs';
import { AssetForm } from '../../asset-editor-page/asset-editor-page.component';
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
  protected dataSource: MatTableDataSource<ContactItem> = new MatTableDataSource();
  protected displayedColumns: TableColumns[] = ['name', 'role', 'delete'];
  private subscriptions: Subscription = new Subscription();
  private readonly store = inject(Store);
  private readonly dialogService: MatDialog = inject(MatDialog);

  public ngOnInit() {
    this.subscriptions.add(
      this.form.controls.assetContacts.valueChanges
        .pipe(
          startWith(this.form.controls.assetContacts.value),
          combineLatestWith(this.store.select(fromAppShared.selectContactItems)),
          tap(([assetContacts, contacts]) => {
            if (contacts) {
              this.dataSource.data = assetContacts
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

  protected openDialog() {
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

  protected removeContact(element: ContactItem) {
    const idx = this.form.controls.assetContacts.controls.findIndex((control) => control.value.id === element.id);
    this.form.controls.assetContacts.removeAt(idx);
    this.form.markAsDirty();
  }
}
