import { FocusMonitor } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, ElementRef, inject, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroupDirective } from '@angular/forms';
import { fromAppShared } from '@asset-sg/client-shared';
import { eqAssetLanguageEdit } from '@asset-sg/shared';
import { Role } from '@asset-sg/shared/v2';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import * as O from 'fp-ts/Option';
import { combineLatest, map, Observable, ReplaySubject, shareReplay, startWith, switchMap } from 'rxjs';

import { eqIdVM } from '../../models';
import {
  AssetEditorFormGroup,
  AssetEditorGeneralFormGroup,
  isAssetEditorFormDisabled$,
} from '../asset-editor-form-group';

interface AssetEditorTabGeneralState {
  referenceDataVM: fromAppShared.ReferenceDataVM;
  userInsertMode: boolean;
  currentlyEditedIdIndex: number;
}

const initialAssetEditorTabGeneralState: AssetEditorTabGeneralState = {
  referenceDataVM: fromAppShared.emptyReferenceDataVM,
  userInsertMode: false,
  currentlyEditedIdIndex: -1,
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
  protected readonly rootFormGroup: AssetEditorFormGroup = this.rootFormGroupDirective.control;
  private readonly formBuilder = inject(FormBuilder);
  private readonly focusMonitor = inject(FocusMonitor);

  @ViewChild('idFormDescription')
  private readonly idFormDescription?: ElementRef<HTMLInputElement>;

  public form!: AssetEditorGeneralFormGroup;

  public idForm = this.formBuilder.group({
    idId: new FormControl<O.Option<number>>(O.none, { nonNullable: true }),
    id: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    description: new FormControl<string>('', { nonNullable: true }),
  });

  public showWarningForReferences = false;

  public readonly state: RxState<AssetEditorTabGeneralState> = inject(RxState<AssetEditorTabGeneralState>);

  public readonly _referenceDataVM$ = this.state.select('referenceDataVM');

  private readonly ngOnInit$ = new ReplaySubject<void>(1);
  private readonly idsLength$ = this.ngOnInit$.pipe(
    switchMap(() =>
      this.form.valueChanges.pipe(
        startWith(null),
        map(() => this.form.controls['ids'].value.length)
      )
    ),
    startWith(0),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public readonly userInsertMode$ = this.state.select('userInsertMode');
  public readonly notMoreThanOneId$ = this.idsLength$.pipe(
    map((length) => length <= 1),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public readonly showIdForm$ = combineLatest([this.userInsertMode$, this.notMoreThanOneId$]).pipe(
    map(([userInsertMode, notMoreThanOneId]) => userInsertMode || notMoreThanOneId),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public readonly showList$ = combineLatest([this.userInsertMode$, this.idsLength$]).pipe(
    map(([userInsertMode, idsLength]) => userInsertMode || idsLength > 1)
  );

  public readonly idFormCompleteAndValid$ = this.idForm.valueChanges.pipe(
    startWith(null),
    map(() => this.idForm.controls['id'].value && this.idForm.valid)
  );

  public readonly showCreateNewIdButton$ = combineLatest([
    this.idFormCompleteAndValid$,
    this.userInsertMode$,
    this.showList$,
  ]).pipe(
    map(
      ([idFormCompleteAndValid, userInsertMode, showList]) =>
        (idFormCompleteAndValid && !userInsertMode) || (showList && !userInsertMode)
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public currentlyEditedIdIndex$ = this.state.select('currentlyEditedIdIndex');

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
    this.idForm.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      if (!this.state.get().userInsertMode && !this.idForm.controls['id'].value) {
        this.idForm.controls['description'].reset(undefined, { emitEvent: false });
        this.idForm.controls['description'].disable({ emitEvent: false });
      } else if (this.idForm.controls['description'].disabled) {
        this.idForm.controls['description'].enable({ emitEvent: false });
        this.idForm.controls['description'].markAsTouched();
        if (this.idFormDescription) {
          this.focusMonitor.focusVia(this.idFormDescription?.nativeElement, 'program');
        }
      }

      // sync the idForm state with the ids control in the general form
      if (this.state.get().currentlyEditedIdIndex !== -1) {
        const ids = [...this.form.controls['ids'].value];
        if (this.idForm.valid) {
          if (ids.length === 0) {
            this.form.controls['ids'].setValue([...this.form.controls['ids'].value, this.idForm.getRawValue()]);
            this.form.controls['ids'].markAsDirty();
          } else if (!eqIdVM.equals(ids[this.state.get().currentlyEditedIdIndex], this.idForm.getRawValue())) {
            ids[this.state.get().currentlyEditedIdIndex] = this.idForm.getRawValue();
            this.form.controls['ids'].setValue(ids, { emitEvent: false });
            this.form.markAsDirty();
          }
        } else if (ids.length > 0) {
          this.form.controls.ids.setValue(
            ids.filter((_, i) => i !== this.state.get().currentlyEditedIdIndex),
            { emitEvent: false }
          );
          this.form.markAsDirty();
        }
      }
    });
  }

  public readonly isDisabled$ = isAssetEditorFormDisabled$(this.rootFormGroup);

  ngOnInit(): void {
    this.form = this.rootFormGroup.get('general') as AssetEditorGeneralFormGroup;
    this.isDisabled$.pipe(untilDestroyed(this)).subscribe((disabled) => {
      if (disabled) {
        this.idForm.disable();
      } else {
        this.idForm.enable();
      }
    });
    this.form.valueChanges.pipe(startWith(null), untilDestroyed(this)).subscribe(() => {
      if (this.form.controls['ids'].value.length === 0) {
        this.state.set({ currentlyEditedIdIndex: 0 });
      } else if (this.form.controls['ids'].value.length === 1) {
        this.state.set({ currentlyEditedIdIndex: 0 });
        const { idId, id, description } = this.form.controls['ids'].value[0];
        this.idForm.patchValue({ idId, id, description });
      }
    });
    this.setDisabledStatusOfWorkgroup();
    this.rootFormGroup.controls.references.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.setDisabledStatusOfWorkgroup();
    });
    this.ngOnInit$.next();
  }

  public _insertNewIdClicked() {
    this.state.set({ userInsertMode: true, currentlyEditedIdIndex: -1 });
    this.idForm.reset();
    this.idForm.markAsUntouched();
  }

  public _cancelIdFormClicked() {
    this.state.set({ userInsertMode: false, currentlyEditedIdIndex: -1 });
    this.idForm.reset();
    if (this.form.controls['ids'].value.length === 1) {
      this.state.set({ currentlyEditedIdIndex: 0 });
      const { id, description } = this.form.controls['ids'].value[0];
      this.idForm.patchValue({ id, description });
    }
  }

  public _saveIdFormClicked() {
    const i = this.state.get().currentlyEditedIdIndex;
    this.state.set({ userInsertMode: false, currentlyEditedIdIndex: -1 });
    if (i >= 0) {
      const newIds = [...this.form.controls.ids.value];
      newIds[i] = { ...this.idForm.getRawValue(), idId: O.none };
      this.form.controls.ids.setValue(newIds);
      this.form.markAsDirty();
    } else {
      this.form.controls.ids.setValue([
        ...this.form.controls['ids'].value,
        { ...this.idForm.getRawValue(), idId: O.none },
      ]);
      this.form.markAsDirty();
    }
    this.idForm.reset();
  }

  public _deleteIdClicked(index: number) {
    this.form.controls['ids'].setValue(this.form.controls['ids'].value.filter((_, i) => i !== index));
    this.form.controls['ids'].markAsDirty();
  }

  public _editIdClicked(index: number) {
    this.state.set({ userInsertMode: true, currentlyEditedIdIndex: index });
    const { id, description } = this.form.controls['ids'].value[index];
    this.idForm.patchValue({ id, description });
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
