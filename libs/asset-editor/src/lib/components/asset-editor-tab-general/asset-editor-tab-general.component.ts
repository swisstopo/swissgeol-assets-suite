import { FocusMonitor } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroupDirective } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { RxState } from '@rx-angular/state';
import * as O from 'fp-ts/Option';
import {
    BehaviorSubject,
    Observable,
    ReplaySubject,
    combineLatest,
    distinctUntilChanged,
    map,
    shareReplay,
    startWith,
    switchMap,
} from 'rxjs';

import { fromAppShared } from '@asset-sg/client-shared';
import { eqAssetLanguageEdit } from '@asset-sg/shared';

import { eqIdVM } from '../../models';
import { AssetEditorFormGroup, AssetEditorGeneralFormGroup } from '../asset-editor-form-group';

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
    private _rootFormGroupDirective = inject(FormGroupDirective);
    private rootFormGroup = this._rootFormGroupDirective.control as AssetEditorFormGroup;
    private _formBuilder = inject(FormBuilder);
    private _focusMonitor = inject(FocusMonitor);

    @ViewChild('idFormDescription') private _idFormDescription?: ElementRef<HTMLInputElement>;

    public _form!: AssetEditorGeneralFormGroup;

    public idForm = this._formBuilder.group({
        idId: new FormControl<O.Option<number>>(O.none, { nonNullable: true }),
        id: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
        description: new FormControl<string>('', { nonNullable: true }),
    });

    public _state: RxState<AssetEditorTabGeneralState> = inject(RxState<AssetEditorTabGeneralState>);

    public _referenceDataVM$ = this._state.select('referenceDataVM');

    private _ngOnInit$ = new ReplaySubject<void>(1);
    private idsLength$ = this._ngOnInit$.pipe(
        switchMap(() =>
            this._form.valueChanges.pipe(
                startWith(null),
                map(() => this._form.controls['ids'].value.length),
            ),
        ),
        startWith(0),
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    public _userInsertMode$ = this._state.select('userInsertMode');
    public _notMoreThanOneId$ = this.idsLength$.pipe(
        map(length => length <= 1),
        shareReplay({ bufferSize: 1, refCount: true }),
    );
    public _showIdForm$ = combineLatest([this._userInsertMode$, this._notMoreThanOneId$]).pipe(
        map(([userInsertMode, notMoreThanOneId]) => userInsertMode || notMoreThanOneId),
        shareReplay({ bufferSize: 1, refCount: true }),
    );
    public _showList$ = combineLatest([this._userInsertMode$, this.idsLength$]).pipe(
        map(([userInsertMode, idsLength]) => userInsertMode || idsLength > 1),
    );

    public _idFormCompleteAndValid$ = this.idForm.valueChanges.pipe(
        startWith(null),
        map(() => this.idForm.controls['id'].value && this.idForm.valid),
    );

    public _showCreateNewIdButton$ = combineLatest([
        this._idFormCompleteAndValid$,
        this._userInsertMode$,
        this._showList$,
    ]).pipe(
        map(
            ([idFormCompleteAndValid, userInsertMode, showList]) =>
                (idFormCompleteAndValid && !userInsertMode) || (showList && !userInsertMode),
        ),
        shareReplay({ bufferSize: 1, refCount: true }),
    );
    public _currentlyEditedIdIndex$ = this._state.select('currentlyEditedIdIndex');

    @Input()
    public set referenceDataVM$(value: Observable<fromAppShared.ReferenceDataVM>) {
        this._state.connect('referenceDataVM', value);
    }

    constructor() {
        this._state.set(initialAssetEditorTabGeneralState);
        this.idForm.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
            if (!this._state.get().userInsertMode && !this.idForm.controls['id'].value) {
                this.idForm.controls['description'].reset(undefined, { emitEvent: false });
                this.idForm.controls['description'].disable({ emitEvent: false });
            } else if (this.idForm.controls['description'].disabled) {
                this.idForm.controls['description'].enable({ emitEvent: false });
                this.idForm.controls['description'].markAsTouched();
                if (this._idFormDescription) {
                    this._focusMonitor.focusVia(this._idFormDescription?.nativeElement, 'program');
                }
            }

            // sync the idForm state with the ids control in the general form
            if (this._state.get().currentlyEditedIdIndex !== -1) {
                const ids = [...this._form.controls['ids'].value];
                if (this.idForm.valid) {
                    if (ids.length === 0) {
                        this._form.controls['ids'].setValue([
                            ...this._form.controls['ids'].value,
                            this.idForm.getRawValue(),
                        ]);
                        this._form.controls['ids'].markAsDirty();
                    } else if (
                        !eqIdVM.equals(ids[this._state.get().currentlyEditedIdIndex], this.idForm.getRawValue())
                    ) {
                        ids[this._state.get().currentlyEditedIdIndex] = this.idForm.getRawValue();
                        this._form.controls['ids'].setValue(ids, { emitEvent: false });
                        this._form.markAsDirty();
                    }
                } else if (ids.length > 0) {
                    this._form.controls.ids.setValue(
                        ids.filter((_, i) => i !== this._state.get().currentlyEditedIdIndex),
                        { emitEvent: false },
                    );
                    this._form.markAsDirty();
                }

            }
        });
    }

    public _disableAll$ = this.rootFormGroup.statusChanges.pipe(
        startWith(this.rootFormGroup.status),
        map(status => status === 'DISABLED'),
        distinctUntilChanged(),
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    ngOnInit(): void {
        this._form = this.rootFormGroup.get('general') as AssetEditorGeneralFormGroup;
        this._disableAll$.pipe(untilDestroyed(this)).subscribe(disabled => {
            if (disabled) {
                this.idForm.disable();
            } else {
                this.idForm.enable();
            }
        });
        this._form.valueChanges.pipe(startWith(null), untilDestroyed(this)).subscribe(() => {
            if (this._form.controls['ids'].value.length === 0) {
                this._state.set({ currentlyEditedIdIndex: 0 });
            } else if (this._form.controls['ids'].value.length === 1) {
                this._state.set({ currentlyEditedIdIndex: 0 });
                const { idId, id, description } = this._form.controls['ids'].value[0];
                this.idForm.patchValue({ idId, id, description });
            }
        });
        this._ngOnInit$.next();
    }

    public _removeManCatLabelRef(value: string) {
        this._form.controls['manCatLabelRefs'].setValue(
            this._form.controls['manCatLabelRefs'].value.filter((v: string) => v !== value),
        );
    }

    public _insertNewIdClicked() {
        this._state.set({ userInsertMode: true, currentlyEditedIdIndex: -1 });
        this.idForm.reset();
        this.idForm.markAsUntouched();
    }

    public _cancelIdFormClicked() {
        this._state.set({ userInsertMode: false, currentlyEditedIdIndex: -1 });
        this.idForm.reset();
        if (this._form.controls['ids'].value.length === 1) {
            this._state.set({ currentlyEditedIdIndex: 0 });
            const { id, description } = this._form.controls['ids'].value[0];
            this.idForm.patchValue({ id, description });
        }
    }

    public _saveIdFormClicked() {
        const i = this._state.get().currentlyEditedIdIndex;
        this._state.set({ userInsertMode: false, currentlyEditedIdIndex: -1 });
        if (i >= 0) {
            const newIds = [...this._form.controls.ids.value];
            newIds[i] = { ...this.idForm.getRawValue(), idId: O.none }
            this._form.controls.ids.setValue(newIds);
            this._form.markAsDirty();
        } else {
            this._form.controls.ids.setValue([
                ...this._form.controls['ids'].value,
                { ...this.idForm.getRawValue(), idId: O.none },
            ]);
            this._form.markAsDirty();
        }
        this.idForm.reset();
    }

    public _deleteIdClicked(index: number) {
        this._form.controls['ids'].setValue(this._form.controls['ids'].value.filter((_, i) => i !== index));
        this._form.controls['ids'].markAsDirty();
    }

    public _editIdClicked(index: number) {
        this._state.set({ userInsertMode: true, currentlyEditedIdIndex: index });
        const { id, description } = this._form.controls['ids'].value[index];
        this.idForm.patchValue({ id, description });
    }

    public _fileInvalid$ = new BehaviorSubject<boolean>(false);
    public _fileInputChange(inputElement: HTMLInputElement) {
        const files = inputElement.files;
        if (files && files.length > 0) {
            if (Array.from(files).some(f => f.size > 250 * 1024 * 1024)) {
                this._fileInvalid$.next(true);
            } else {
                this._form.controls.newFiles.push(new FormControl(Array.from(files)[0], { nonNullable: true }));
                this._form.markAsDirty();
                this._fileInvalid$.next(false);
                inputElement.value = '';
            }
        }
    }

    public _removeFileToBeUploaded(index: number) {
        this._form.controls.newFiles.removeAt(index);
    }

    public _deleteFile(fileId: number) {
        this._form.controls.filesToDelete.setValue([...this._form.controls.filesToDelete.value, fileId]);
        this._form.controls.assetFiles.setValue(
            this._form.controls.assetFiles.value.map(f => (f.fileId !== fileId ? f : { ...f, willBeDeleted: true })),
        );
        this._form.markAsDirty();
    }
    
    public eqAssetLanguageEdit = eqAssetLanguageEdit
}
