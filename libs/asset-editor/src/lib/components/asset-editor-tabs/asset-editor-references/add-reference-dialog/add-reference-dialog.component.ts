import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AssetEditDetail, LinkedAsset } from '@asset-sg/shared';
import { AssetId, AssetSearchResultDTO, AssetSearchResultItem } from '@asset-sg/shared/v2';
import { plainToInstance } from 'class-transformer';
import * as O from 'fp-ts/Option';
import { combineLatest, debounceTime, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { NewReferenceDialogData } from '../../../../models/new-reference-dialog-data.interface';
import { AssetForm } from '../../../asset-editor-page/asset-editor-page.component';
import { LinkedAssetType } from '../asset-editor-references.component';

@Component({
  selector: 'asset-sg-add-reference-dialog',
  templateUrl: './add-reference-dialog.component.html',
  styleUrls: ['./add-reference-dialog.component.scss'],
  standalone: false,
})
export class AddReferenceDialogComponent implements OnInit {
  public types = [
    {
      key: LinkedAssetType.Sibling,
      translation: { key: `edit.tabs.references.referenceType.sibling` },
    },
    {
      key: LinkedAssetType.Main,
      translation: { key: `edit.tabs.references.referenceType.parent` },
    },
  ];
  public asset: AssetEditDetail | null = null;
  public form!: AssetForm['controls']['references'];

  public newReferenceForm = new FormGroup({
    linkedAsset: new FormControl<LinkedAsset | null>(null, { validators: Validators.required }),
    type: new FormControl<LinkedAssetType>(LinkedAssetType.Sibling, { validators: Validators.required }),
  });
  private assetsToIgnore$!: Observable<AssetId[]>;
  private assetsToChooseFrom$!: Observable<AssetSearchResultItem[]>;
  public optionsToDisplay$!: Observable<LinkedAsset[]>;
  public searchTerm$ = new Subject<string>();

  private readonly data = inject<NewReferenceDialogData>(MAT_DIALOG_DATA);

  private readonly httpClient = inject(HttpClient);
  private readonly dialogRef = inject(MatDialogRef<AddReferenceDialogComponent>);

  public ngOnInit() {
    this.form = this.data.form;
    this.asset = this.data.asset;
    this.types = this.asset
      ? O.toNullable(this.asset.assetMain)
        ? [
            {
              key: LinkedAssetType.Sibling,
              translation: { key: `edit.tabs.references.referenceType.sibling` },
            },
          ]
        : this.types
      : this.types;

    this.assetsToIgnore$ = this.form.valueChanges.pipe(
      startWith(this.form.value),
      map((references) => {
        const ids = [] as AssetId[];
        if (this.asset !== null) {
          ids.push(this.asset.assetId);
        }
        if (references.mainAsset != null) {
          ids.push(references.mainAsset.assetId);
        }
        if (references.siblingAssets != null) {
          ids.push(...references.siblingAssets.map((it) => it.assetId));
        }
        if (references.subordinateAssets != null) {
          ids.push(...references.subordinateAssets.map((it) => it.assetId));
        }
        return ids;
      }),
    );
    this.assetsToChooseFrom$ = this.searchTerm$.pipe(
      debounceTime(300),
      switchMap(
        (value): Observable<AssetSearchResultItem[]> =>
          value.length >= 3
            ? this.httpClient
                .post(`/api/assets/search?limit=10`, {
                  text: value,
                  workgroupIds: [this.data.workgroupId],
                })
                .pipe(
                  map((res) => {
                    console.log(res);
                    const data = plainToInstance(AssetSearchResultDTO, res);
                    return data.data;
                  }),
                )
            : of([]),
      ),
    );
    this.optionsToDisplay$ = combineLatest([this.assetsToIgnore$, this.assetsToChooseFrom$]).pipe(
      tap((it) => console.log('tapped', it)),
      map(([assetIdsToIgnore, queriedAssets]) =>
        queriedAssets
          .filter((asset) => !assetIdsToIgnore.includes(asset.assetId))
          .map((asset) => ({
            titlePublic: asset.titlePublic,
            assetId: asset.assetId,
          })),
      ),
    );
  }

  get hasWorkgroupId(): boolean {
    return this.data.workgroupId !== null;
  }

  public inputChange(event: string) {
    this.searchTerm$.next(event);
  }

  setSelectedAsset(asset: LinkedAsset) {
    this.newReferenceForm.controls.linkedAsset.setValue(asset);
  }

  public cancel() {
    this.dialogRef.close(false);
  }

  public addReference() {
    const { linkedAsset, type } = this.newReferenceForm.value;
    if (!linkedAsset || !type) {
      return;
    }
    if (type === LinkedAssetType.Main) {
      this.form.controls.mainAsset.setValue(linkedAsset);
    } else {
      this.form.controls.siblingAssets.setValue([...this.form.controls.siblingAssets.value, linkedAsset]);
    }
    this.dialogRef.close(true);
  }
}
