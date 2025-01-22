import { ChangeDetectionStrategy, Component, inject, Input, OnInit } from '@angular/core';
import { FormGroupDirective } from '@angular/forms';
import { fromAppShared } from '@asset-sg/client-shared';
import { eqAssetLanguageEdit } from '@asset-sg/shared';
import { Role } from '@asset-sg/shared/v2';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { map, Observable, ReplaySubject } from 'rxjs';

import { AssetEditorFormGroup, AssetEditorGeneralFormGroup } from '../asset-editor-form-group';

interface AssetEditorTabGeneralState {
  referenceDataVM: fromAppShared.ReferenceDataVM;
}

const initialAssetEditorTabGeneralState: AssetEditorTabGeneralState = {
  referenceDataVM: fromAppShared.emptyReferenceDataVM,
};

@UntilDestroy()
@Component({
  selector: 'asset-sg-editor-tab-general',
  templateUrl: './asset-editor-tab-general.component.html',
  styleUrls: ['./asset-editor-tab-general.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: { class: 'edit-area' },
  providers: [RxState],
})
export class AssetEditorTabGeneralComponent implements OnInit {
  private readonly rootFormGroupDirective = inject(FormGroupDirective);
  private readonly rootFormGroup: AssetEditorFormGroup = this.rootFormGroupDirective.control;

  public form!: AssetEditorGeneralFormGroup;

  public showWarningForReferences = false;

  public readonly state: RxState<AssetEditorTabGeneralState> = inject(RxState<AssetEditorTabGeneralState>);

  public readonly _referenceDataVM$ = this.state.select('referenceDataVM');

  private readonly ngOnInit$ = new ReplaySubject<void>(1);

  private readonly store = inject(Store);

  /**
   * The workgroups to which the user is allowed to assign an asset.
   */
  public readonly availableWorkgroups$ = this.store
    .select(fromAppShared.selectWorkgroups)
    .pipe(map((workgroups) => workgroups.filter((it) => it.role != Role.Viewer)));

  @Input()
  public set referenceDataVM$(value: Observable<fromAppShared.ReferenceDataVM>) {
    this.state.connect('referenceDataVM', value);
  }

  constructor() {
    this.state.set(initialAssetEditorTabGeneralState);
  }

  ngOnInit(): void {
    this.form = this.rootFormGroup.get('general') as AssetEditorGeneralFormGroup;
    this.setDisabledStatusOfWorkgroup();
    this.rootFormGroup.controls.references.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.setDisabledStatusOfWorkgroup();
    });
    this.ngOnInit$.next();
  }

  private setDisabledStatusOfWorkgroup() {
    if (
      this.rootFormGroup.getRawValue().references.siblingAssets.length > 0 ||
      this.rootFormGroup.getRawValue().references.childAssets.length > 0 ||
      this.rootFormGroup.getRawValue().references.assetMain
    ) {
      this.form.controls.workgroupId.disable({ emitEvent: false });
      this.showWarningForReferences = true;
    } else {
      this.form.controls.workgroupId.enable({ emitEvent: false });
      this.showWarningForReferences = false;
    }
  }

  public eqAssetLanguageEdit = eqAssetLanguageEdit;
}
