import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AssetEditDetail, AssetSearchResultDTO, LinkedAsset } from '@asset-sg/shared';
import { AssetId } from '@asset-sg/shared/v2';
import { plainToInstance } from 'class-transformer';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import { combineLatest, debounceTime, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';
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
  private assetsToIgnore$: Observable<AssetId[]> = new Observable<AssetId[]>();
  private assetsToChooseFrom$: Observable<AssetEditDetail[]> = new Observable<AssetEditDetail[]>();
  public optionsToDisplay$!: Observable<LinkedAsset[]>;
  public searchTerm$ = new Subject<string>();
  private readonly data = inject<{
    form: AssetForm['controls']['references'];
    asset: AssetEditDetail | null;
  }>(MAT_DIALOG_DATA);

  private readonly httpClient = inject(HttpClient);
  private readonly dialogRef = inject(MatDialogRef<AddReferenceDialogComponent>);

  constructor() {
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
  }

  public ngOnInit() {
    this.assetsToIgnore$ = this.form.valueChanges.pipe(
      startWith(this.form.value),
      map((references) => [
        ...(references.mainAsset ? [references.mainAsset.assetId] : []),
        ...(references.siblingAssets ? references.siblingAssets.map((reference) => reference.assetId) : []),
        ...(references.subordinateAssets ? references.subordinateAssets.map((reference) => reference.assetId) : []),
      ]),
    );
    this.assetsToChooseFrom$ = this.searchTerm$.pipe(
      debounceTime(300),
      switchMap(
        (value): Observable<AssetEditDetail[]> =>
          value.length >= 3
            ? this.httpClient
                .post(`/api/assets/search?limit=10`, {
                  text: value,
                  workgroupIds: [this.asset?.workgroupId],
                })
                .pipe(
                  map((res) => plainToInstance(AssetSearchResultDTO, res)),
                  map((result) =>
                    result.data.map((asset) => (AssetEditDetail.decode(asset) as E.Right<AssetEditDetail>).right),
                  ),
                )
            : of([]),
      ),
    );
    this.optionsToDisplay$ = combineLatest([this.assetsToIgnore$, this.assetsToChooseFrom$]).pipe(
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
    const linkedAsset = this.newReferenceForm.controls.linkedAsset.value;
    const type = this.newReferenceForm.controls.type.value;
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
