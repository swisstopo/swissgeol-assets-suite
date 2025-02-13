import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Location } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { fromAppShared, LifecycleHooksDirective, RoutingService } from '@asset-sg/client-shared';
import { isTruthy, ORD } from '@asset-sg/core';
import { ContactEdit, GeomFromGeomText, PatchAsset, PatchContact } from '@asset-sg/shared';
import * as RD from '@devexperts/remote-data-ts';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { FileType } from '@prisma/client';
import * as A from 'fp-ts/Array';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import { BehaviorSubject, filter, map, Observable, of, take } from 'rxjs';

import { TabPageBridgeService } from '../../services/tab-page-bridge.service';
import * as actions from '../../state/asset-editor.actions';
import { AppStateWithAssetEditor } from '../../state/asset-editor.reducer';
import * as fromAssetEditor from '../../state/asset-editor.selectors';
import { AssetEditorFile, AssetEditorFileTypeFormGroup, makeAssetEditorFormGroup } from '../asset-editor-form-group';

@UntilDestroy()
@Component({
  selector: 'asset-sg-editor-tab-page',
  styleUrls: ['./asset-editor-tab-page.component.scss'],
  templateUrl: './asset-editor-tab-page.component.html',
  hostDirectives: [LifecycleHooksDirective],
  standalone: false,
})
export class AssetEditorTabPageComponent implements AfterViewInit {
  @ViewChildren('tabsWrapper', { read: ElementRef }) _tabsWrapper!: QueryList<ElementRef<HTMLDivElement>>;
  @ViewChild('tabPanelGeneralContent') _tabPanelGeneralContent!: TemplateRef<unknown>;
  @ViewChild('tabPanelFilesContent') _tabPanelFilesContent!: TemplateRef<unknown>;
  @ViewChild('tabPanelUsageContent') _tabPanelUsageContent!: TemplateRef<unknown>;
  @ViewChild('tabPanelContactsContent') _tabPanelContactsContent!: TemplateRef<unknown>;
  @ViewChild('tabPanelReferencesContent') _tabPanelReferencesContent!: TemplateRef<unknown>;
  @ViewChild('tabPanelGeometriesContent') _tabPanelGeometriesContent!: TemplateRef<unknown>;
  @ViewChild('tabPanelAdministrationContent') _tabPanelAdministrationContent!: TemplateRef<unknown>;
  @ViewChild('tmplDiscardDialog') _tmplDiscardDialog!: TemplateRef<unknown>;

  private readonly _store = inject(Store<AppStateWithAssetEditor>);
  private readonly _tabPageBridgeService = inject(TabPageBridgeService);
  private readonly _dialogService = inject(Dialog);

  private readonly routingService = inject(RoutingService);
  private readonly location = inject(Location);

  public isFormReady = false;

  public activeTab = Tab.General;

  public _discardDialogRef?: DialogRef<boolean>;

  public _showProgressBar$ = new BehaviorSubject<boolean>(false);

  public referenceDataVM$ = this._store.select(fromAppShared.selectRDReferenceDataVM).pipe(
    filter(RD.isSuccess),
    map((a) => a.value)
  );
  public assetEditDetail$ = this._store.select(fromAssetEditor.selectRDAssetEditDetail).pipe(ORD.fromFilteredSuccess);

  public form = makeAssetEditorFormGroup();

  constructor() {
    this._tabPageBridgeService.registerTabPage(this);

    this.form.disable();

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
          if (this.location.path().match(/(\w{3})/g)?.[3] === 'new') {
            this.location.replaceState(this.location.path().replace(/new/, String(asset.assetId)));
          }

          const filesByType: Record<FileType, AssetEditorFile[]> = {
            Normal: [],
            Legal: [],
          };
          for (const file of asset.assetFiles) {
            filesByType[file.type].push({
              ...file,
              willBeDeleted: false,
            });
          }

          this.form.patchValue({
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
              workgroupId: asset.workgroupId,
            },
            files: {
              normalFiles: {
                newFiles: [],
                filesToDelete: [],
                existingFiles: filesByType.Normal,
              },
              legalFiles: {
                newFiles: [],
                filesToDelete: [],
                existingFiles: filesByType.Legal,
              },
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
        this.form.controls.files.controls.normalFiles.controls.newFiles.clear();
        this.form.controls.files.controls.legalFiles.controls.newFiles.clear();
        this.form.enable();
        this.form.markAsUntouched();
        this.form.markAsPristine();
        if (O.isNone(maybeAsset)) {
          this.form.controls.administration.controls.newStatusWorkItemCode.disable();
        }
      });
  }

  ngAfterViewInit(): void {
    this.referenceDataVM$.pipe(take(1)).subscribe(() => {
      setTimeout(() => {
        this.isFormReady = true;
      });
    });
  }

  selectTab(tab: Tab): void {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    const pathPrefix = this.urlPath.substring(0, this.indexOfLastSlashInUrlPath);
    this.location.replaceState(`${pathPrefix}/${tab}`);
  }

  delete(): void {
    const { general } = this.form.getRawValue();
    this._store.dispatch(actions.deleteAsset({ assetId: general.id }));
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    const { general, files, usage, contacts, geometries, references, administration } = this.form.getRawValue();

    this.form.disable();

    const extractAssetFiles = (group: ReturnType<AssetEditorFileTypeFormGroup['getRawValue']>) =>
      group.existingFiles.filter((file) => !group.filesToDelete.includes(file.id));

    const patchAsset: PatchAsset = {
      titlePublic: general.titlePublic,
      titleOriginal: general.titleOriginal,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      createDate: general.createDate!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      receiptDate: general.receiptDate!,
      publicUse: {
        isAvailable: usage.publicUse,
        startAvailabilityDate: O.fromNullable(usage.publicStartAvailabilityDate),
        statusAssetUseItemCode: usage.publicUseStatusAssetUseCode,
      },
      internalUse: {
        isAvailable: usage.internalUse,
        startAvailabilityDate: O.fromNullable(usage.internalStartAvailabilityDate),
        statusAssetUseItemCode: usage.internalUseStatusAssetUseCode,
      },
      assetKindItemCode: general.assetKindItemCode,
      assetFormatItemCode: general.assetFormatItemCode,
      isNatRel: usage.isNatRel,
      typeNatRels: usage.natRelTypeItemCodes,
      manCatLabelRefs: general.manCatLabelRefs,
      assetLanguages: general.assetLanguages,
      assetContacts: contacts.assetContacts,
      assetFiles: [...extractAssetFiles(files.normalFiles), ...extractAssetFiles(files.legalFiles)],
      ids: general.ids,
      studies: pipe(
        geometries.studies,
        A.filter((study) => study.studyId.match('new') === null),
        A.map((study) => ({
          studyId: study.studyId,
          geomText: GeomFromGeomText.encode(study.geom),
        }))
      ),
      newStudies: pipe(
        geometries.studies,
        A.filter((study) => study.studyId.match('new') !== null),
        A.map((study) => GeomFromGeomText.encode(study.geom))
      ),
      newStatusWorkItemCode: O.fromNullable(administration.newStatusWorkItemCode),
      assetMainId: O.fromNullable(references.assetMain?.assetId),
      siblingAssetIds: references.siblingAssets.map((asset) => asset.assetId),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      workgroupId: general.workgroupId!,
    };
    this._showProgressBar$.next(true);
    if (general.id === 0) {
      this._store.dispatch(actions.createNewAsset({ patchAsset }));
    } else {
      this._store.dispatch(
        actions.updateAssetEditDetail({
          assetId: general.id,
          patchAsset,
          filesToDelete: [...files.normalFiles.filesToDelete, ...files.legalFiles.filesToDelete],
          newFiles: [...files.normalFiles.newFiles, ...files.legalFiles.newFiles],
        })
      );
    }
  }

  editContact(contact: ContactEdit) {
    this._store.dispatch(actions.editContact({ contact }));
  }

  createContact(contact: PatchContact) {
    this._store.dispatch(actions.createContact({ contact }));
  }

  public close(): void {
    this.routingService.navigateBack(['/']).then();
  }

  public canLeave(): Observable<boolean> {
    if (this.form.pristine) return of(true);
    const dialogRef = (this._discardDialogRef = this._dialogService.open(this._tmplDiscardDialog, {
      disableClose: true,
    }));
    return dialogRef.closed.pipe(map(isTruthy));
  }

  private get urlPath(): string {
    return this.location.path().split('?', 2)[0];
  }

  private get indexOfLastSlashInUrlPath(): number {
    return this.urlPath.lastIndexOf('/');
  }

  public get tabs(): Tab[] {
    return Object.values(Tab);
  }

  protected readonly Tab = Tab;
}

enum Tab {
  General = 'general',
  Files = 'files',
  Usage = 'usage',
  Contacts = 'contacts',
  References = 'references',
  Geometries = 'geometries',
  Administration = 'administration',
}
