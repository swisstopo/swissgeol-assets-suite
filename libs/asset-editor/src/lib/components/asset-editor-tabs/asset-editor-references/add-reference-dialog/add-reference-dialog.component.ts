import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Asset, AssetId, AssetSearchResultItem, AssetSearchResultSchema } from '@asset-sg/shared/v2';
import { plainToInstance } from 'class-transformer';
import { combineLatest, debounceTime, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';
import { NewReferenceDialogData } from '../../../../models/new-reference-dialog-data.interface';
import { AssetForm } from '../../../asset-editor-page/asset-editor-page.component';
import { LinkType } from '../asset-editor-references.component';

@Component({
  selector: 'asset-sg-add-reference-dialog',
  templateUrl: './add-reference-dialog.component.html',
  styleUrls: ['./add-reference-dialog.component.scss'],
  standalone: false,
})
export class AddReferenceDialogComponent implements OnInit {
  public asset: Asset | null = null;
  public form!: AssetForm['controls']['references'];

  public newReferenceForm = new FormGroup({
    linkedAsset: new FormControl<LinkedAsset | null>(null, { validators: Validators.required }),
    type: new FormControl<LinkType>(LinkType.Sibling, { validators: Validators.required }),
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

    this.assetsToIgnore$ = this.form.valueChanges.pipe(
      startWith(this.form.value),
      map((references) => {
        const ids = [] as AssetId[];
        if (this.asset !== null) {
          ids.push(this.asset.id);
        }
        if (references.parent != null) {
          ids.push(references.parent.id);
        }
        if (references.siblings != null) {
          ids.push(...references.siblings.map((it) => it.id));
        }
        if (references.children != null) {
          ids.push(...references.children.map((it) => it.id));
        }
        return ids;
      }),
    );
    this.assetsToChooseFrom$ = this.searchTerm$.pipe(
      debounceTime(300),
      switchMap((term): Observable<AssetSearchResultItem[]> => {
        if (term.length < 3 || (this.linkedAsset != null && this.linkedAsset.title === term)) {
          return of([]);
        }
        return this.httpClient
          .post(`/api/assets/search?limit=10`, {
            text: term,
            workgroupIds: [this.data.workgroupId],
          })
          .pipe(
            map((res) => {
              const data = plainToInstance(AssetSearchResultSchema, res);
              return data.data;
            }),
          );
      }),
    );
    this.optionsToDisplay$ = combineLatest([this.assetsToIgnore$, this.assetsToChooseFrom$]).pipe(
      map(([assetIdsToIgnore, queriedAssets]) =>
        queriedAssets
          .filter((asset) => !assetIdsToIgnore.includes(asset.id))
          .map((asset) => ({
            id: asset.id,
            title: asset.title,
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

  get linkedAsset(): LinkedAsset | null | undefined {
    return this.newReferenceForm.value.linkedAsset;
  }

  public addReference() {
    const { linkedAsset, type } = this.newReferenceForm.value;
    if (!linkedAsset || !type) {
      return;
    }
    if (type === LinkType.Main) {
      this.form.controls.parent.setValue(linkedAsset);
    } else {
      this.form.controls.siblings.setValue([...this.form.controls.siblings.value, linkedAsset]);
    }
    this.dialogRef.close(true);
  }

  protected readonly LinkedAssetType = LinkType;
}

type LinkedAsset = Pick<Asset, 'id' | 'title'>;
