import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroupDirective, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { httpErrorResponseError } from '@asset-sg/client-shared';
import { unknownToUnknownError } from '@asset-sg/core';
import { AssetByTitle, AssetEditDetail, LinkedAsset } from '@asset-sg/shared';
import { UntilDestroy } from '@ngneat/until-destroy';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import { flow, pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';

import { AssetEditorFormGroup, AssetEditorReferencesFormGroup } from '../asset-editor-form-group';

type AssetReferenceType = 'parent' | 'sibling';

@UntilDestroy()
@Component({
  selector: 'asset-sg-editor-tab-references',
  templateUrl: './asset-editor-tab-references.component.html',
  styleUrls: ['./asset-editor-tab-references.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: { class: 'edit-area' },
})
export class AssetEditorTabReferencesComponent implements OnInit {
  @ViewChild('authorInput') private _authorInput!: ElementRef<HTMLInputElement>;
  private _rootFormGroupDirective = inject(FormGroupDirective);
  private rootFormGroup = this._rootFormGroupDirective.control as AssetEditorFormGroup;
  private _formBuilder = inject(FormBuilder);
  private _httpClient = inject(HttpClient);

  public _form!: AssetEditorReferencesFormGroup;

  public _newReferenceForm = this._formBuilder.group({
    assetReferenceType: new FormControl<AssetReferenceType | 'sibling' | null>(null, Validators.required),
    linkedAsset: new FormControl<LinkedAsset | null>(null, Validators.required),
  });

  public _assets$!: Observable<LinkedAsset[]>;
  public _authorSearchInput$ = new Subject<string>();

  public _formValid$ = this._newReferenceForm.valueChanges.pipe(
    startWith(null),
    map(() => this._newReferenceForm.valid),
    distinctUntilChanged()
  );
  public _addParentDisabled$!: Observable<boolean>;

  public assetIdsToIgnore$!: Observable<number[]>;

  ngOnInit(): void {
    this._form = this.rootFormGroup.get('references') as AssetEditorReferencesFormGroup;
    this._setAssetReferenceType();
    this.assetIdsToIgnore$ = this._form.valueChanges.pipe(
      startWith(null),
      map(() => [
        this._form.getRawValue().thisAssetId,
        ...(this._form.controls.assetMain.value ? [this._form.controls.assetMain.value.assetId] : []),
        ...this._form.getRawValue().childAssets.map((a) => a.assetId),
        ...this._form.getRawValue().siblingAssets.map((a) => a.assetId),
      ])
    );
    this._assets$ = combineLatest([
      this.assetIdsToIgnore$,
      this._authorSearchInput$.pipe(
        debounceTime(300),
        switchMap(
          (value): Observable<LinkedAsset[]> =>
            value.length >= 3
              ? this._httpClient
                  .post(`/api/assets/search?limit=10`, {
                    text: value,
                    workgroupIds: [this.rootFormGroup.getRawValue().general.workgroupId],
                  })
                  .pipe(
                    map((res) => (res as { data: AssetEditDetail[] }).data),
                    catchError((err: HttpErrorResponse | unknown) =>
                      of(err instanceof HttpErrorResponse ? httpErrorResponseError(err) : unknownToUnknownError(err))
                    ),
                    map(
                      flow(
                        D.array(AssetEditDetail).decode,
                        E.getOrElseW(() => [])
                      )
                    )
                  )
              : of([])
        )
      ),
    ]).pipe(
      map(([assetIdsToIgnore, queriedAssets]) =>
        pipe(
          queriedAssets,
          A.filter((a) => !assetIdsToIgnore.includes(a.assetId))
        )
      )
    );
    this._addParentDisabled$ = this._form.valueChanges.pipe(
      startWith(null),
      map(() => this._form.getRawValue().assetMain != null),
      distinctUntilChanged()
    );
  }

  public assetAutocompleteDisplayFn = (asset: AssetByTitle | null): string => {
    return asset ? asset.titlePublic : '';
  };

  onAssetSelected(event: MatAutocompleteSelectedEvent) {
    this._newReferenceForm.patchValue({ linkedAsset: event.option.value });
  }

  public addLink() {
    if (this._newReferenceForm.valid) {
      const { assetReferenceType, linkedAsset } = this._newReferenceForm.getRawValue();
      if (assetReferenceType == 'parent' && linkedAsset) {
        this._form.patchValue({ assetMain: linkedAsset });
        this._form.markAsDirty();
      }
      if (assetReferenceType == 'sibling' && linkedAsset) {
        this._form.patchValue({ siblingAssets: this._form.getRawValue().siblingAssets.concat(linkedAsset) });
        this._form.markAsDirty();
      }
      this._newReferenceForm.reset();
      this._setAssetReferenceType();
      this._authorInput.nativeElement.value = '';
      this._authorSearchInput$.next('');
    }
  }

  public removeLink(referenceType: AssetReferenceType, assetId: number) {
    if (referenceType == 'parent' && this._form.getRawValue().assetMain?.assetId == assetId) {
      this._form.patchValue({ assetMain: null });
      this._form.markAsDirty();
      this._setAssetReferenceType();
    }
    if (referenceType == 'sibling') {
      this._form.patchValue({
        siblingAssets: this._form.getRawValue().siblingAssets.filter((asset: LinkedAsset) => asset.assetId != assetId),
      });
      this._form.markAsDirty();
    }
  }

  private _setAssetReferenceType() {
    if (this._form.getRawValue().assetMain) {
      this._newReferenceForm.patchValue({ assetReferenceType: 'sibling' });
      this._newReferenceForm.controls.assetReferenceType.disable();
    } else {
      this._newReferenceForm.patchValue({ assetReferenceType: null });
      this._newReferenceForm.controls.assetReferenceType.enable();
    }
  }
}
