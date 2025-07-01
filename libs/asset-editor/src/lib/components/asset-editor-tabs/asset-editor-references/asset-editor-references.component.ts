import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Asset, LinkedAsset, WorkgroupId } from '@asset-sg/shared/v2';
import { startWith, Subscription } from 'rxjs';
import { NewReferenceDialogData } from '../../../models/new-reference-dialog-data.interface';
import { AssetForm } from '../../asset-editor-page/asset-editor-page.component';
import { AddReferenceDialogComponent } from './add-reference-dialog/add-reference-dialog.component';

@Component({
  selector: 'asset-sg-editor-references',
  styleUrls: ['./asset-editor-references.component.scss'],
  templateUrl: './asset-editor-references.component.html',
  standalone: false,
})
export class AssetEditorReferencesComponent implements OnInit, OnDestroy {
  @Input() form!: AssetForm['controls']['references'];

  @Input() asset: Asset | null = null;

  @Input() workgroupId!: WorkgroupId | null;

  public COLUMNS = ['name', 'assetId', 'type', 'actions'];
  public dataSource: MatTableDataSource<FormLinkedAsset> = new MatTableDataSource();
  private readonly subscriptions: Subscription = new Subscription();
  private readonly dialogService = inject(MatDialog);

  public ngOnInit() {
    this.subscriptions.add(
      this.form.valueChanges.pipe(startWith(this.form.value)).subscribe((references) => {
        const data: FormLinkedAsset[] = [];
        if (references.parent) {
          data.push({
            ...references.parent,
            type: LinkType.Main,
          });
        }
        if (references.siblings) {
          data.push(
            ...references.siblings.map((asset) => ({
              ...asset,
              type: LinkType.Sibling,
            })),
          );
        }
        if (references.children) {
          data.push(
            ...references.children.map((asset) => ({
              ...asset,
              type: LinkType.Subordinate,
            })),
          );
        }
        this.dataSource.data = data;
      }),
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public removeReference(reference: FormLinkedAsset) {
    if (reference.type === LinkType.Main) {
      this.form.controls.parent.setValue(null);
    }
    if (reference.type === LinkType.Sibling) {
      const remainingReferences = this.form.controls.siblings.value?.filter((asset) => asset.id !== reference.id) ?? [];
      this.form.controls.siblings.setValue(remainingReferences);
    }
    this.form.markAsDirty();
  }

  openDialog() {
    const dialogRef = this.dialogService.open<AddReferenceDialogComponent, NewReferenceDialogData>(
      AddReferenceDialogComponent,
      {
        width: '674px',
        restoreFocus: false,
        data: {
          form: this.form,
          asset: this.asset,
          workgroupId: this.workgroupId,
        },
      },
    );

    this.subscriptions.add(
      dialogRef.afterClosed().subscribe((wasReferenceAdded) => {
        if (wasReferenceAdded) {
          this.form.markAsDirty();
        }
      }),
    );
  }

  protected readonly LinkedAssetType = LinkType;
}

export enum LinkType {
  Main = 'parent',
  Sibling = 'sibling',
  Subordinate = 'subordinate',
}

interface FormLinkedAsset extends LinkedAsset {
  type: LinkType;
}
