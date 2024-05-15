import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroupDirective } from '@angular/forms';
import { RxState } from '@rx-angular/state';
import * as O from 'fp-ts/Option';
import { Observable } from 'rxjs';

import { fromAppShared } from '@asset-sg/client-shared';
import { DateId } from '@asset-sg/shared';

import { AssetEditDetailVM } from '../../models';
import { AssetEditorAdministrationFormGroup, AssetEditorFormGroup } from '../asset-editor-form-group';

export interface LastProcessedDetails {
    lastProcessedDate: O.Option<DateId>;
    processor: string;
}

interface TabAdministrationState {
    referenceDataVM: fromAppShared.ReferenceDataVM;
    assetEditDetail: O.Option<AssetEditDetailVM>;
}

const initialTabAdministrationState: TabAdministrationState = {
    referenceDataVM: fromAppShared.emptyReferenceDataVM,
    assetEditDetail: O.none,
};

@Component({
    selector: 'asset-sg-editor-tab-administration',
    templateUrl: './asset-editor-tab-administration.component.html',
    styleUrls: ['./asset-editor-tab-administration.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    // eslint-disable-next-line @angular-eslint/no-host-metadata-property
    host: { class: 'edit-area' },
    providers: [RxState],
})
export class AssetEditorTabAdministrationComponent implements OnInit {
    public _rootFormGroupDirective = inject(FormGroupDirective);
    public _rootFormGroup = this._rootFormGroupDirective.control as AssetEditorFormGroup;
    private _formBuilder = inject(FormBuilder);
    private _state = inject<RxState<TabAdministrationState>>(RxState);

    public _form!: AssetEditorAdministrationFormGroup;

    public _referenceDataVM$ = this._state.select('referenceDataVM');
    public _assetEditDetail$ = this._state.select('assetEditDetail');

    // eslint-disable-next-line @angular-eslint/no-output-rename
    @Output('save')
    public save$ = new EventEmitter<void>();

    constructor() {
        this._state.set(initialTabAdministrationState);
    }

    @Input()
    public set referenceDataVM$(value: Observable<fromAppShared.ReferenceDataVM>) {
        this._state.connect('referenceDataVM', value);
    }

    @Input()
    public set assetEditDetail$(value: Observable<O.Option<AssetEditDetailVM>>) {
        this._state.connect('assetEditDetail', value);
    }

    ngOnInit(): void {
        this._form = this._rootFormGroup.get('administration') as AssetEditorAdministrationFormGroup;
        if (this._rootFormGroup.invalid) {
            this._rootFormGroup.markAllAsTouched();
        }
    }

    public save() {
        this.save$.emit();
    }
}
