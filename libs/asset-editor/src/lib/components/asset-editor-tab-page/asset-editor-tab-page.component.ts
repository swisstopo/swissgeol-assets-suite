import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewChildren,
  ViewContainerRef,
} from '@angular/core';
import { fromAppShared, LifecycleHooks, LifecycleHooksDirective } from '@asset-sg/client-shared';
import { isNotNil, isTruthy, ORD } from '@asset-sg/core';
import { ContactEdit, GeomFromGeomText, PatchAsset, PatchContact } from '@asset-sg/shared';
import * as RD from '@devexperts/remote-data-ts';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as A from 'fp-ts/Array';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import { KobalteTabs } from 'ngx-kobalte';
import { BehaviorSubject, filter, map, Observable, of, startWith, switchMap } from 'rxjs';
import { from } from 'solid-js';

import { TabPageBridgeService } from '../../services/tab-page-bridge.service';
import * as actions from '../../state/asset-editor.actions';
import { AppStateWithAssetEditor } from '../../state/asset-editor.reducer';
import * as fromAssetEditor from '../../state/asset-editor.selectors';
import { makeAssetEditorFormGroup } from '../asset-editor-form-group';

@UntilDestroy()
@Component({
  selector: 'asset-sg-editor-tab-page',
  styleUrls: ['./asset-editor-tab-page.component.scss'],
  templateUrl: './asset-editor-tab-page.component.html',
  hostDirectives: [LifecycleHooksDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetEditorTabPageComponent {
  @ViewChildren('tabsWrapper', { read: ElementRef }) _tabsWrapper!: QueryList<ElementRef<HTMLDivElement>>;
  @ViewChild('tabPanelGeneralContent') _tabPanelGeneralContent!: TemplateRef<unknown>;
  @ViewChild('tabPanelUsageContent') _tabPanelUsageContent!: TemplateRef<unknown>;
  @ViewChild('tabPanelContactsContent') _tabPanelContactsContent!: TemplateRef<unknown>;
  @ViewChild('tabPanelReferencesContent') _tabPanelReferencesContent!: TemplateRef<unknown>;
  @ViewChild('tabPanelGeometriesContent') _tabPanelGeometriesContent!: TemplateRef<unknown>;
  @ViewChild('tabPanelAdministrationContent') _tabPanelAdministrationContent!: TemplateRef<unknown>;
  @ViewChild('tmplDiscardDialog') _tmplDiscardDialog!: TemplateRef<unknown>;

  private _lc = inject(LifecycleHooks);
  private _viewContainerRef = inject(ViewContainerRef);
  private _translateService = inject(TranslateService);
  private _store = inject(Store<AppStateWithAssetEditor>);
  private _location = inject(Location);
  private _tabPageBridgeService = inject(TabPageBridgeService);
  private _dialogService = inject(Dialog);

  public _discardDialogRef?: DialogRef<boolean>;

  public _showProgressBar$ = new BehaviorSubject<boolean>(false);

  public referenceDataVM$ = this._store.select(fromAppShared.selectRDReferenceDataVM).pipe(
    filter(RD.isSuccess),
    map((a) => a.value)
  );
  public assetEditDetail$ = this._store.select(fromAssetEditor.selectRDAssetEditDetail).pipe(ORD.fromFilteredSuccess);

  public _form = makeAssetEditorFormGroup();

  constructor() {
    this._tabPageBridgeService.registerTabPage(this);

    this._form.disable();

    this._store
      .select(fromAssetEditor.selectRDAssetEditDetail)
      .pipe(filter(RD.isPending), untilDestroyed(this))
      .subscribe(() => this._showProgressBar$.next(true));

    this._store
      .select(fromAssetEditor.selectRDAssetEditDetail)
      .pipe(ORD.fromFilteredSuccess, untilDestroyed(this))
      .subscribe((maybeAsset) => {
        this._showProgressBar$.next(false);
        if (O.isSome(maybeAsset)) {
          const asset = maybeAsset.value;
          if (this._location.path().match(/(\w+)/g)?.[3] === 'new') {
            this._location.replaceState(this._location.path().replace(/new/, String(asset.assetId)));
          }
          this._form.patchValue({
            general: {
              id: asset.assetId,
              titlePublic: asset.titlePublic,
              sgsId: asset.sgsId,
              titleOriginal: asset.titleOriginal,
              createDate: asset.createDate,
              receiptDate: asset.receiptDate,
              assetKindItemCode: asset.assetKindItemCode,
              assetFormatItemCode: asset.assetFormatItemCode,
              assetLanguages: asset.assetLanguages,
              manCatLabelRefs: asset.manCatLabelRefs,
              ids: asset.ids,
              filesToDelete: [],
              newFiles: [],
              assetFiles: asset.assetFiles.map((file) => ({ ...file, willBeDeleted: false })),
              workgroupId: asset.workgroupId,
            },
            usage: {
              publicUse: asset.publicUse.isAvailable,
              publicUseStatusAssetUseCode: asset.publicUse.statusAssetUseItemCode,
              publicStartAvailabilityDate: O.toUndefined(asset.publicUse.startAvailabilityDate),
              internalUse: asset.internalUse.isAvailable,
              internalUseStatusAssetUseCode: asset.internalUse.statusAssetUseItemCode,
              internalStartAvailabilityDate: O.toUndefined(asset.internalUse.startAvailabilityDate),
              isNatRel: asset.isNatRel,
              natRelTypeItemCodes: asset.typeNatRels,
            },
            contacts: {
              assetContacts: asset.assetContacts,
            },
            geometries: {
              studies: asset.studies,
            },
            references: {
              thisAssetId: asset.assetId,
              assetMain: O.toNullable(asset.assetMain),
              childAssets: asset.subordinateAssets,
              siblingAssets: [...asset.siblingXAssets, ...asset.siblingYAssets],
            },
            administration: {
              sgsId: asset.sgsId,
              geolDataInfo: asset.geolDataInfo,
              geolContactDataInfo: asset.geolContactDataInfo,
              geolAuxDataInfo: asset.geolAuxDataInfo,
              statusWorks: asset.statusWorks,
              newStatusWorkItemCode: null,
              municipality: asset.municipality,
            },
          });
        }
        this._form.controls.general.controls.newFiles.clear();
        this._form.enable();
        this._form.markAsUntouched();
        this._form.markAsPristine();
        if (O.isNone(maybeAsset)) {
          this._form.controls.administration.controls.newStatusWorkItemCode.disable();
        }
      });

    this._lc.afterViewInit$
      .pipe(
        switchMap(() => this._tabsWrapper.changes.pipe(startWith(null))),
        map(() => this._tabsWrapper.first?.nativeElement),
        filter(isNotNil),
        untilDestroyed(this)
      )
      .subscribe((element) => {
        const tabKey = this._location.path().match(/(\w+)$/)?.[1];
        const createButtonLabelTranslation = (key: string) =>
          from(
            this._translateService.onLangChange.pipe(
              startWith(null),
              map(() => this._translateService.instant(key))
            )
          );

        const tabs = [
          {
            key: 'general',
            buttonLabel: createButtonLabelTranslation('edit.tabs.general.tabName'),
            content: this._tabPanelGeneralContent,
          },
          {
            key: 'usage',
            buttonLabel: createButtonLabelTranslation('edit.tabs.usage.tabName'),
            content: this._tabPanelUsageContent,
          },
          {
            key: 'contacts',
            buttonLabel: createButtonLabelTranslation('edit.tabs.contacts.tabName'),
            content: this._tabPanelContactsContent,
          },
          {
            key: 'references',
            buttonLabel: createButtonLabelTranslation('edit.tabs.references.tabName'),
            content: this._tabPanelReferencesContent,
          },
          {
            key: 'geometries',
            buttonLabel: createButtonLabelTranslation('edit.tabs.geometries.tabName'),
            content: this._tabPanelGeometriesContent,
          },
          {
            key: 'administration',
            buttonLabel: createButtonLabelTranslation('edit.tabs.administration.tabName'),
            content: this._tabPanelAdministrationContent,
          },
        ];

        const changeToTab = (key: string | undefined) => {
          if (!key) return;
          setTimeout(() => {
            const panel = element.querySelector('div[role="tabpanel"]');
            const tab = tabs.find((tab) => tab.key === key);
            if (panel && tab) {
              const viewRef = this._viewContainerRef.createEmbeddedView(tab.content, undefined);
              for (const node of viewRef.rootNodes) {
                panel.appendChild(node);
              }
            }
          });
        };

        let lastTabValue: string | undefined = undefined;
        const onValueChange = (value: string) => {
          if (value === lastTabValue) return;
          lastTabValue = value;
          this._location.replaceState(this._location.path().replace(/\w+$/, value));
          changeToTab(value);
        };
        KobalteTabs(
          element,
          { onValueChange, defaultValue: tabKey },
          of(
            tabs.map((tab) => ({
              value: tab.key,
              triggerProps: {
                children: tab.buttonLabel,
              },
              contentProps: {},
            }))
          )
        );

        changeToTab(tabKey);
      });
  }

  save() {
    if (this._form.valid) {
      this._form.disable();
      const patchAsset: PatchAsset = {
        titlePublic: this._form.getRawValue().general.titlePublic,
        titleOriginal: this._form.getRawValue().general.titleOriginal,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        createDate: this._form.getRawValue().general.createDate!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        receiptDate: this._form.getRawValue().general.receiptDate!,
        publicUse: {
          isAvailable: this._form.getRawValue().usage.publicUse,
          startAvailabilityDate: O.fromNullable(this._form.getRawValue().usage.publicStartAvailabilityDate),
          statusAssetUseItemCode: this._form.getRawValue().usage.publicUseStatusAssetUseCode,
        },
        internalUse: {
          isAvailable: this._form.getRawValue().usage.internalUse,
          startAvailabilityDate: O.fromNullable(this._form.getRawValue().usage.internalStartAvailabilityDate),
          statusAssetUseItemCode: this._form.getRawValue().usage.internalUseStatusAssetUseCode,
        },
        assetKindItemCode: this._form.getRawValue().general.assetKindItemCode,
        assetFormatItemCode: this._form.getRawValue().general.assetFormatItemCode,
        isNatRel: this._form.getRawValue().usage.isNatRel,
        typeNatRels: this._form.getRawValue().usage.natRelTypeItemCodes,
        manCatLabelRefs: this._form.getRawValue().general.manCatLabelRefs,
        assetLanguages: this._form.getRawValue().general.assetLanguages,
        assetContacts: this._form.getRawValue().contacts.assetContacts,
        ids: this._form.getRawValue().general.ids,
        studies: pipe(
          this._form.getRawValue().geometries.studies,
          A.filter((study) => study.studyId.match('new') === null),
          A.map((study) => ({
            studyId: study.studyId,
            geomText: GeomFromGeomText.encode(study.geom),
          }))
        ),
        newStudies: pipe(
          this._form.getRawValue().geometries.studies,
          A.filter((study) => study.studyId.match('new') !== null),
          A.map((study) => GeomFromGeomText.encode(study.geom))
        ),
        newStatusWorkItemCode: O.fromNullable(this._form.getRawValue().administration.newStatusWorkItemCode),
        assetMainId: O.fromNullable(this._form.getRawValue().references.assetMain?.assetId),
        siblingAssetIds: this._form.getRawValue().references.siblingAssets.map((asset) => asset.assetId),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        workgroupId: this._form.getRawValue().general.workgroupId!,
      };
      this._showProgressBar$.next(true);
      if (this._form.getRawValue().general.id === 0) {
        this._store.dispatch(actions.createNewAsset({ patchAsset }));
      } else {
        this._store.dispatch(
          actions.updateAssetEditDetail({
            assetId: this._form.getRawValue().general.id,
            patchAsset,
            filesToDelete: this._form.getRawValue().general.filesToDelete,
            newFiles: this._form.getRawValue().general.newFiles,
          })
        );
      }
    }
  }

  editContact(contact: ContactEdit) {
    this._store.dispatch(actions.editContact({ contact }));
  }

  createContact(contact: PatchContact) {
    this._store.dispatch(actions.createContact({ contact }));
  }

  public canLeave(): Observable<boolean> {
    if (this._form.pristine) return of(true);
    const dialogRef = (this._discardDialogRef = this._dialogService.open(this._tmplDiscardDialog, {
      disableClose: true,
    }));
    return dialogRef.closed.pipe(map(isTruthy));
  }
}
