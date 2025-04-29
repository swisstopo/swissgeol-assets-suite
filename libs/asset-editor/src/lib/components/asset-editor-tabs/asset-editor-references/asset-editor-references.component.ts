import { Component, Input, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { LinkedAsset } from '@asset-sg/shared';
import { Subscription } from 'rxjs';
import { AssetForm } from '../../asset-editor-page/asset-editor-page.component';

@Component({
  selector: 'asset-sg-editor-references',
  styleUrls: ['./asset-editor-references.component.scss'],
  templateUrl: './asset-editor-references.component.html',
  standalone: false,
})
export class AssetEditorReferencesComponent implements OnInit {
  @Input() form!: AssetForm['controls']['references'];
  public COLUMNS = ['name', 'assetId', 'type', 'actions'];
  public dataSource: MatTableDataSource<FormLinkedAsset> = new MatTableDataSource();
  private readonly subscriptions: Subscription = new Subscription();

  public ngOnInit() {
    this.subscriptions.add(
      this.form.valueChanges.subscribe((references) => {
        const data: FormLinkedAsset[] = [];
        if (references.mainAsset) {
          data.push({
            ...references.mainAsset,
            type: LinkedAssetType.Main,
            readonly: false,
          });
        }
        if (references.siblingAssets) {
          data.push(
            ...references.siblingAssets.map((asset) => ({
              ...asset,
              type: LinkedAssetType.Sibling,
              readonly: false,
            })),
          );
        }
        if (references.subordinateAssets) {
          data.push(
            ...references.subordinateAssets.map((asset) => ({
              ...asset,
              type: LinkedAssetType.Subordinate,
              readonly: true,
            })),
          );
        }
        this.dataSource.data = data;
      }),
    );
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
}

enum LinkedAssetType {
  Main = 'parent',
  Sibling = 'sibling',
  Subordinate = 'subordinate',
}

interface FormLinkedAsset extends LinkedAsset {
  type: LinkedAssetType;
  readonly: boolean;
}
