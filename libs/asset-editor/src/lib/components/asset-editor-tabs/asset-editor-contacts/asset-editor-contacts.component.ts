import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { fromAppShared } from '@asset-sg/client-shared';
import { AssetEditDetail } from '@asset-sg/shared';
import { Store } from '@ngrx/store';
import { combineLatestWith, Subscription, tap } from 'rxjs';
import { AssetForm } from '../../asset-editor-page/asset-editor-page.component';

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
  private readonly store = inject(Store);
  private subscriptions: Subscription = new Subscription();

  public ngOnInit() {
    this.subscriptions.add(
      this.form.controls.assetContacts.valueChanges
        .pipe(
          combineLatestWith(this.store.select(fromAppShared.selectContactItems)),
          tap(([assetContacts, contacts]) => {
            if (contacts) {
              this.dataSource.data = assetContacts.map((contactMatch) => {
                const contact = contacts[contactMatch.id];
                return {
                  role: contactMatch.role,
                  name: contact.name,
                  id: contact.id,
                };
              });
            }
          }),
        )
        .subscribe(),
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  protected removeContact(element: ContactItem) {
    const idx = this.form.controls.assetContacts.controls.findIndex((control) => control.value.id === element.id);
    this.form.controls.assetContacts.removeAt(idx);
  }
}
