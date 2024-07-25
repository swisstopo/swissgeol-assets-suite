import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, Input, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { FormGroupDirective } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { LifecycleHooks, LifecycleHooksDirective, fromAppShared } from '@asset-sg/client-shared';
import { isNotNull } from '@asset-sg/core';
import { isMasterEditor } from '@asset-sg/shared/v2';
import * as RD from '@devexperts/remote-data-ts';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { RxState } from '@rx-angular/state';

import * as O from 'fp-ts/Option';
import { Observable, map, of, startWith, switchMap, withLatestFrom, filter } from 'rxjs';
import { AssetEditDetailVM } from '../../models';
import { AssetEditorFormGroup, AssetEditorUsageFormGroup } from '../asset-editor-form-group';

interface AssetEditorTabUsageState {
  referenceDataVM: fromAppShared.ReferenceDataVM;
  assetEditDetail: O.Option<AssetEditDetailVM>;
}

const initialAssetEditorTabUsageState: AssetEditorTabUsageState = {
  referenceDataVM: fromAppShared.emptyReferenceDataVM,
  assetEditDetail: O.none,
};

@UntilDestroy()
@Component({
  selector: 'asset-sg-editor-tab-usage',
  templateUrl: './asset-editor-tab-usage.component.html',
  styleUrls: ['./asset-editor-tab-usage.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: { class: 'edit-area' },
  providers: [RxState],
  hostDirectives: [LifecycleHooksDirective],
})
export class AssetEditorTabUsageComponent implements OnInit {
  private _rootFormGroupDirective = inject(FormGroupDirective);
  private _lc = inject(LifecycleHooks);
  private _translateService = inject(TranslateService);
  private _dialogService = inject(Dialog);

  private rootFormGroup = this._rootFormGroupDirective.control as AssetEditorFormGroup;
  public _form!: AssetEditorUsageFormGroup;

  public _state: RxState<AssetEditorTabUsageState> = inject(RxState<AssetEditorTabUsageState>);
  public _referenceDataVM$ = this._state.select('referenceDataVM');

  private _dialogRefRemoveNationalInterestDialog?: DialogRef;

  private readonly filteredAssetEditDetail$ = this._state
    .select('assetEditDetail')
    .pipe(map(O.toNullable), filter(isNotNull));

  private readonly store = inject(Store);
  public readonly isMasterEditor$ = this.store.select(fromAppShared.selectRDUserProfile).pipe(
    map(RD.toNullable),
    filter(isNotNull),
    withLatestFrom(this.filteredAssetEditDetail$),
    map(([user, assetEditDetail]) => isMasterEditor(user, assetEditDetail.workgroupId))
  );

  @ViewChild('tmplRemoveNationalInterestDialog') private _tmplRemoveNationalInterestDialog!: TemplateRef<unknown>;

  @Input()
  public set referenceDataVM$(value: Observable<fromAppShared.ReferenceDataVM>) {
    this._state.connect('referenceDataVM', value);
  }

  @Input()
  public set assetEditDetail$(value: Observable<O.Option<AssetEditDetailVM>>) {
    this._state.connect('assetEditDetail', value);
  }

  private _form$ = this._lc.onInit$.pipe(map(() => this.rootFormGroup.controls['usage']));

  public _internalStartAvailabilityDateErrorText$ = this._form$.pipe(
    switchMap((form) => form.controls['internalStartAvailabilityDate'].statusChanges),
    switchMap((status) =>
      status === 'INVALID'
        ? this.getUsageErrorText(this._form.controls['internalStartAvailabilityDate'].errors)
        : of(null)
    )
  );

  public _publicStartAvailabilityDateErrorText$ = this._form$.pipe(
    switchMap((form) => form.controls['publicStartAvailabilityDate'].statusChanges),
    switchMap((status) =>
      status === 'INVALID'
        ? this.getUsageErrorText(this._form.controls['publicStartAvailabilityDate'].errors)
        : of(null)
    )
  );

  constructor() {
    this._state.set(initialAssetEditorTabUsageState);
  }

  ngOnInit(): void {
    this._form = this.rootFormGroup.get('usage') as AssetEditorUsageFormGroup;
    this._form.controls['internalUse'].valueChanges
      .pipe(startWith(this._form.controls['internalUse'].value), untilDestroyed(this))
      .subscribe((internalUse) => {
        if (internalUse) {
          this._form.controls['internalStartAvailabilityDate'].reset(null, { emitEvent: false });
          this._form.controls['internalStartAvailabilityDate'].disable({ emitEvent: false });
        } else {
          if (this._form.enabled) {
            this._form.controls['internalStartAvailabilityDate'].enable({ emitEvent: false });
          }
        }
      });
    this._form.controls['publicUse'].valueChanges
      .pipe(startWith(this._form.controls['publicUse'].value), untilDestroyed(this))
      .subscribe((publicUse) => {
        if (publicUse) {
          this._form.controls['internalUse'].setValue(true, { emitEvent: false });
          this._form.controls['internalUse'].disable();
          this._form.controls['publicStartAvailabilityDate'].reset(null, { emitEvent: false });
          this._form.controls['publicStartAvailabilityDate'].disable({ emitEvent: false });
        } else {
          if (this._form.enabled) {
            this._form.controls['internalUse'].enable();
            this._form.controls['publicStartAvailabilityDate'].enable({ emitEvent: false });
          }
        }
      });

    this._form.controls['isNatRel'].valueChanges
      .pipe(startWith(this._form.controls['isNatRel'].value), untilDestroyed(this))
      .subscribe((isNatRel) => {
        if (isNatRel && this._form.enabled) {
          this._form.controls['natRelTypeItemCodes'].enable({ emitEvent: false });
        }
      });
  }

  public _isNatRelChanged(ev: MatCheckboxChange) {
    if (!ev.checked) {
      if (this._form.controls['natRelTypeItemCodes'].value.length > 0) {
        this._form.controls['isNatRel'].setValue(true, { emitEvent: false });
        this._dialogRefRemoveNationalInterestDialog = this._dialogService.open(this._tmplRemoveNationalInterestDialog, {
          disableClose: true,
        });
      } else {
        this._form.controls['natRelTypeItemCodes'].disable();
      }
    }
  }

  public _closeDeleteNationalInterest(confirm: boolean) {
    this._dialogRefRemoveNationalInterestDialog?.close(confirm);
    if (!confirm) {
      this._form.controls['isNatRel'].setValue(true);
    } else {
      this._form.controls['isNatRel'].setValue(false);
      this._form.controls['natRelTypeItemCodes'].reset(undefined);
      this._form.controls['natRelTypeItemCodes'].disable();
    }
  }

  public getUsageErrorText(errors: null | { internalPublicUsageDateError?: true }) {
    return errors && errors.internalPublicUsageDateError
      ? this._translateService.get('edit.tabs.usage.validationErrors.internalPublicUsageDateError')
      : of(null);
  }
}
