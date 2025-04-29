import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { AssetEditDetail, LinkedAsset } from '@asset-sg/shared';
import { startWith, Subscription } from 'rxjs';
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
  @Input() asset: AssetEditDetail | null = null;
  public COLUMNS = ['name', 'assetId', 'type', 'actions'];
  public dataSource: MatTableDataSource<FormLinkedAsset> = new MatTableDataSource();
  private readonly subscriptions: Subscription = new Subscription();
  private readonly dialogService = inject(MatDialog);

  public ngOnInit() {
    this.subscriptions.add(
      this.form.valueChanges.pipe(startWith(this.form.value)).subscribe((references) => {
        const data: FormLinkedAsset[] = [];
        if (references.mainAsset) {
          data.push({
            ...references.mainAsset,
            type: LinkedAssetType.Main,
          });
        }
        if (references.siblingAssets) {
          data.push(
            ...references.siblingAssets.map((asset) => ({
              ...asset,
              type: LinkedAssetType.Sibling,
            })),
          );
        }
        if (references.subordinateAssets) {
          data.push(
            ...references.subordinateAssets.map((asset) => ({
              ...asset,
              type: LinkedAssetType.Subordinate,
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
    if (reference.type === LinkedAssetType.Main) {
      this.form.controls.mainAsset.setValue(null);
    }
    if (reference.type === LinkedAssetType.Sibling) {
      const remainingReferences =
        this.form.controls.siblingAssets.value?.filter((asset) => asset.assetId !== reference.assetId) ?? [];
      this.form.controls.siblingAssets.setValue(remainingReferences);
    }
    this.form.markAsDirty();
  }

  openDialog() {
    const dialogRef = this.dialogService.open<AddReferenceDialogComponent>(AddReferenceDialogComponent, {
      width: '674px',
      restoreFocus: false,
      data: {
        form: this.form,
        asset: this.asset,
      },
    });

    this.subscriptions.add(
      dialogRef.afterClosed().subscribe((wasReferenceAdded) => {
        if (wasReferenceAdded) {
          this.form.markAsDirty();
        }
      }),
    );
  }

  protected readonly LinkedAssetType = LinkedAssetType;
}

export enum LinkedAssetType {
  Main = 'parent',
  Sibling = 'sibling',
  Subordinate = 'subordinate',
}

interface FormLinkedAsset extends LinkedAsset {
  type: LinkedAssetType;
}
