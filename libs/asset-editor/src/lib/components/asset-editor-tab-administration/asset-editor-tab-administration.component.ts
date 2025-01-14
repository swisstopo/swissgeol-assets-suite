import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormGroupDirective } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, fromAppShared } from '@asset-sg/client-shared';
import { isNotNull } from '@asset-sg/core';
import { DateId } from '@asset-sg/shared';
import { isMasterEditor } from '@asset-sg/shared/v2';
import * as RD from '@devexperts/remote-data-ts';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import * as O from 'fp-ts/Option';
import { filter, map, Observable, withLatestFrom } from 'rxjs';

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

@UntilDestroy()
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
  public readonly rootFormGroupDirective = inject(FormGroupDirective);
  public readonly rootFormGroup = this.rootFormGroupDirective.control as AssetEditorFormGroup;
  private readonly state = inject<RxState<TabAdministrationState>>(RxState);

  public _form!: AssetEditorAdministrationFormGroup;

  public readonly _referenceDataVM$ = this.state.select('referenceDataVM');
  public readonly _assetEditDetail$ = this.state.select('assetEditDetail');
  private readonly dialogService = inject(MatDialog);

  private readonly filteredAssetEditDetail$ = this.state
    .select('assetEditDetail')
    .pipe(map(O.toNullable), filter(isNotNull));

  private readonly store = inject(Store);
  public readonly isMasterEditor$ = this.store.select(fromAppShared.selectRDUserProfile).pipe(
    map(RD.toNullable),
    filter(isNotNull),
    withLatestFrom(this.filteredAssetEditDetail$),
    map(([user, assetEditDetail]) => isMasterEditor(user, assetEditDetail.workgroupId))
  );

  // eslint-disable-next-line @angular-eslint/no-output-rename
  @Output() public saveAsset = new EventEmitter<void>();
  @Output() public deleteAsset = new EventEmitter<void>();

  constructor() {
    this.state.set(initialTabAdministrationState);
  }

  @Input()
  public set referenceDataVM$(value: Observable<fromAppShared.ReferenceDataVM>) {
    this.state.connect('referenceDataVM', value);
  }

  @Input()
  public set assetEditDetail$(value: Observable<O.Option<AssetEditDetailVM>>) {
    this.state.connect('assetEditDetail', value);
  }

  ngOnInit(): void {
    this._form = this.rootFormGroup.get('administration') as AssetEditorAdministrationFormGroup;
    if (this.rootFormGroup.invalid) {
      this.rootFormGroup.markAllAsTouched();
    }
  }

  public save() {
    this.saveAsset.emit();
  }

  public openConfirmDialog() {
    const dialogRef = this.dialogService.open<ConfirmDialogComponent>(ConfirmDialogComponent, {
      data: {
        text: 'confirmDelete',
      },
    });
    dialogRef.componentInstance.confirmEvent.pipe(untilDestroyed(this)).subscribe(() => {
      this.deleteAsset.emit();
      dialogRef.close();
    });
  }
}
