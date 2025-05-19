import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterStateSnapshot } from '@angular/router';
import {
  AppSharedState,
  ConfirmDialogComponent,
  CURRENT_LANG,
  fromAppShared,
  ROUTER_SEGMENTS,
  RoutingService,
  wktToGeoJSON,
} from '@asset-sg/client-shared';
import {
  AssetEditDetail,
  AssetFile,
  dateFromDateId,
  dateIdFromDate,
  GeomFromGeomText,
  hasHistoricalData,
  Lang,
  LinkedAsset,
  PatchAsset,
  Studies,
} from '@asset-sg/shared';
import { AssetContact, Workflow } from '@asset-sg/shared/v2';
import { untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import * as O from 'fp-ts/lib/Option';
import { filter, Observable, Subscription, switchMap, take, tap } from 'rxjs';
import { EditorMode } from '../../models';
import { AssetEditorService } from '../../services/asset-editor.service';
import * as actions from '../../state/asset-editor.actions';
import { selectWorkflow } from '../../state/asset-editor.selector';
import { Tab } from '../asset-editor-navigation/asset-editor-navigation.component';

@Component({
  selector: 'asset-sg-editor-page',
  templateUrl: './asset-editor-page.component.html',
  styleUrls: ['./asset-editor-page.component.scss'],
  standalone: false,
})
export class AssetEditorPageComponent implements OnInit, OnDestroy {
  public mode = EditorMode.Create;

  /**
   * The current asset. This is `null` while the asset is being loaded, or when a new asset is being created.
   */
  public asset: AssetEditDetail | null = null;

  /**
   * The asset's workflow. This is `null` while the workflow is being loaded, or when a new asset is being created.
   */
  public workflow: Workflow | null = null;
  public form!: AssetForm;
  public activeTab: Tab = Tab.General;
  protected availableTabs: Tab[] = [];
  protected isLoading = false;
  protected readonly Tab = Tab;
  protected readonly EditorMode = EditorMode;
  private currentLang: Lang = 'de';
  private readonly store = inject(Store<AppSharedState>);
  private readonly route = inject(ActivatedRoute);
  private readonly routingService = inject(RoutingService);
  private readonly assetEditorService = inject(AssetEditorService);
  private readonly dialogService = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly currentLang$ = inject(CURRENT_LANG);
  private readonly routerSegments$ = inject(ROUTER_SEGMENTS);
  private readonly subscriptions: Subscription = new Subscription();

  public ngOnInit() {
    this.subscriptions.add(this.currentLang$.subscribe((lang) => (this.currentLang = lang)));
    this.subscriptions.add(
      this.routerSegments$
        .pipe(
          tap((segments) => {
            if (segments !== undefined && segments.length > 0) {
              this.activeTab = segments[segments.length - 1].path as Tab;
            }
          }),
        )
        .subscribe(),
    );
    this.form = buildForm();
    this.loadAssetFromRouteParams();

    if (this.mode === EditorMode.Edit) {
      this.subscriptions.add(
        this.store
          .select(fromAppShared.selectCurrentAsset)
          .pipe(
            filter((asset) => !!asset),
            tap((asset) => {
              this.asset = asset;
              this.initializeTabs();
              this.initializeForm();
            }),
          )
          .subscribe(),
      );
    } else {
      this.initializeTabs();
      this.initializeForm();
    }
    this.subscriptions.add(
      this.store.select(selectWorkflow).subscribe((workflow) => {
        this.workflow = workflow;
      }),
    );
  }

  public ngOnDestroy() {
    this.store.dispatch(actions.reset());
    this.subscriptions.unsubscribe();
  }

  get hasReferences() {
    return (
      this.form.controls.references.controls.siblingAssets.value.length > 0 ||
      this.form.controls.references.controls.subordinateAssets.value.length > 0 ||
      !!this.form.controls.references.controls.mainAsset.value
    );
  }

  public navigateToStart() {
    this.routingService.navigateToRoot().then();
  }

  public initializeForm() {
    this.form.reset();
    const {
      general: { controls: general },
      contacts: { controls: contacts },
    } = this.form.controls;
    general.titlePublic.setValue(this.asset?.titlePublic ?? '');
    general.titleOriginal.setValue(this.asset?.titleOriginal ?? '');
    general.workgroupId.setValue(this.asset?.workgroupId ?? null);
    general.creationDate.setValue(this.asset ? dateFromDateId(this.asset.createDate) : null);
    general.receiptDate.setValue(this.asset ? dateFromDateId(this.asset.receiptDate) : null);
    general.assetLanguages.setValue(this.asset?.assetLanguages ?? []);
    general.assetFormatItemCode.setValue(this.asset?.assetFormatItemCode ?? null);
    general.assetKindItemCode.setValue(this.asset?.assetKindItemCode ?? null);
    general.manCatLabelRefs.setValue(this.asset?.manCatLabelRefs ?? null);
    general.isNatRel.setValue(this.asset?.isNatRel ?? false);
    general.typeNatRels.setValue(this.asset?.typeNatRels ?? []);
    general.ids.setValue(this.asset?.ids ?? []);

    const { controls: files } = this.form.controls.files;
    files.assetFiles.clear();
    this.asset?.assetFiles.forEach((file) => {
      files.assetFiles.push(
        new FormControl<FormAssetFile>(
          {
            ...file,
            selected: false,
            willBeDeleted: false,
          },
          { nonNullable: true },
        ),
      );
    });

    this.form.controls.references.controls.mainAsset.setValue(
      this.asset?.assetMain ? O.toNullable(this.asset.assetMain) : null,
    );
    const siblings = this.asset == null ? [] : [...this.asset.siblingYAssets, ...this.asset.siblingXAssets];
    this.form.controls.references.controls.siblingAssets.setValue(siblings);
    this.form.controls.references.controls.subordinateAssets.setValue(this.asset?.subordinateAssets ?? []);

    this.form.controls.geometries.controls.studies.setValue(
      this.asset?.studies.map((study) => ({
        studyId: study.studyId,
        geom: wktToGeoJSON(study.geomText),
      })) ?? [],
    );

    contacts.assetContacts.clear();
    this.asset?.assetContacts.forEach((contact) => {
      return contacts.assetContacts.push(
        new FormControl<AssetContact>({ id: contact.contactId, role: contact.role }, { nonNullable: true }),
      );
    });
  }

  public openConfirmDialogForAssetDeletion(assetId: number) {
    const dialogRef = this.dialogService.open<ConfirmDialogComponent>(ConfirmDialogComponent, {
      data: {
        text: 'confirmDelete',
      },
    });
    dialogRef
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((hasConfirmed) => {
        if (hasConfirmed) {
          this.store.dispatch(actions.deleteAsset({ assetId }));
        }
      });
  }

  public save() {
    const asset = this.asset;
    if (!this.asset && this.mode === EditorMode.Edit) {
      return;
    }
    const {
      general: { controls: general },
      geometries: { controls: geometries },
      contacts: { controls: contacts },
      references: { controls: references },
      files: { controls: files },
    } = this.form.controls;

    const filesToDelete = files.assetFiles.controls
      .filter((file) => file.value.willBeDeleted)
      .map((file) => file.value.id);
    const newFiles = files.assetFiles.controls
      .filter((file) => file.value.file)
      .map((formAssetFile) => ({
        file: formAssetFile.value.file!,
        type: formAssetFile.value.type,
        legalDocItemCode: formAssetFile.value.legalDocItemCode,
      }));
    const filesToKeep = files.assetFiles.controls
      .filter((file) => !filesToDelete.includes(file.value.id) && !file.value.file)
      .map((file) => file.value);

    const patchAsset: PatchAsset = {
      titlePublic: general.titlePublic.value,
      titleOriginal: general.titleOriginal.value,
      createDate: dateIdFromDate(general.creationDate.value ?? new Date()),
      receiptDate: dateIdFromDate(general.receiptDate.value ?? new Date()),
      assetLanguages: general.assetLanguages.value,
      workgroupId: general.workgroupId.value!,
      assetFormatItemCode: general.assetFormatItemCode.value!,
      assetKindItemCode: general.assetKindItemCode.value!,
      manCatLabelRefs: general.manCatLabelRefs.value!,
      isNatRel: general.isNatRel.value,
      typeNatRels: general.typeNatRels.value,
      ids: general.ids.value.map((id) => ({ ...id, idId: O.fromNullable(id.idId) })),
      assetFiles: filesToKeep,
      assetContacts: contacts.assetContacts.value.map((contact) => ({ contactId: contact.id, role: contact.role })),
      assetMainId: O.fromNullable(references.mainAsset.value?.assetId),
      siblingAssetIds: references.siblingAssets.value.map((sibling) => sibling.assetId),
      studies: geometries.studies.value
        .filter((study) => !study.studyId.includes('_new'))
        .map((study) => ({
          ...study,
          geomText: GeomFromGeomText.encode(study.geom),
        })),
      newStudies: geometries.studies.value
        .filter((study) => study.studyId.includes('_new'))
        .map((newStudy) => GeomFromGeomText.encode(newStudy.geom)),
      internalUse: asset?.internalUse ?? {
        isAvailable: true,
        startAvailabilityDate: O.fromNullable(dateIdFromDate(new Date())),
        statusAssetUseItemCode: 'approved',
      },
      publicUse: asset?.publicUse ?? {
        isAvailable: true,
        startAvailabilityDate: O.fromNullable(dateIdFromDate(new Date())),
        statusAssetUseItemCode: 'approved',
      },
      newStatusWorkItemCode: O.fromNullable(asset?.statusWorks[0].statusWorkItemCode),
    };
    this.isLoading = true;
    this.subscriptions.add(
      this.mode === EditorMode.Edit
        ? this.assetEditorService
            .deleteFiles(asset!.assetId, filesToDelete)
            .pipe(
              switchMap(() => this.assetEditorService.uploadFiles(asset!.assetId, newFiles)),
              switchMap(() => this.assetEditorService.updateAssetDetail(asset!.assetId, patchAsset)),
            )
            .subscribe((asset) => {
              this.isLoading = false;
              this.store.dispatch(actions.updateAssetEditDetailResult({ asset }));
            })
        : this.assetEditorService.createAsset(patchAsset).subscribe((asset) => {
            this.isLoading = false;
            this.form.markAsPristine();
            this.store.dispatch(actions.updateAssetEditDetailResult({ asset }));
            this.router.navigate([this.currentLang, 'asset-admin', asset.assetId]);
          }),
    );
  }

  public canDeactivate(targetRoute: RouterStateSnapshot): boolean | Observable<boolean> {
    if (
      this.form === undefined ||
      !this.form.dirty ||
      targetRoute.url.startsWith(`/${this.currentLang}/asset-admin/${this.asset?.assetId ?? 'new'}`)
    ) {
      return true;
    }
    const dialogRef = this.dialogService.open<ConfirmDialogComponent>(ConfirmDialogComponent, {
      data: {
        text: 'edit.questionDiscardChanges',
      },
    });
    return dialogRef.afterClosed();
  }

  private initializeTabs() {
    this.availableTabs = Object.values(Tab).filter((tab) => {
      return tab !== Tab.LegacyData || !!(this.asset && hasHistoricalData(this.asset));
    });
  }

  private loadAssetFromRouteParams() {
    this.subscriptions.add(
      this.route.paramMap.pipe(take(1)).subscribe((params) => {
        const assetIdFromParam = params.get('assetId');
        if (!assetIdFromParam) {
          return;
        }
        const assetId = parseInt(assetIdFromParam);
        if (isNaN(assetId)) {
          this.mode = EditorMode.Create;
          return;
        }

        this.mode = EditorMode.Edit;
        this.store.dispatch(actions.loadAsset({ assetId }));
      }),
    );
  }
}

export interface FormAssetFile extends AssetFile {
  selected: boolean;
  file?: File;
  willBeDeleted: boolean;
}

const buildForm = () => {
  return new FormGroup({
    general: new FormGroup({
      workgroupId: new FormControl<number | null>(null, { validators: [Validators.required] }),
      titlePublic: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
      titleOriginal: new FormControl(''),
      creationDate: new FormControl<Date | null>(null, { validators: [Validators.required] }),
      receiptDate: new FormControl<Date | null>(null, { validators: [Validators.required] }),
      assetLanguages: new FormControl<Array<{ languageItemCode: string }>>([], { nonNullable: true }),
      assetFormatItemCode: new FormControl<string>('', { validators: [Validators.required] }),
      assetKindItemCode: new FormControl<string>('', { validators: [Validators.required] }),
      manCatLabelRefs: new FormControl<string[]>([], { validators: [Validators.required] }),
      isNatRel: new FormControl<boolean>(false, { nonNullable: true }),
      typeNatRels: new FormControl<string[]>([], { nonNullable: true }),
      ids: new FormControl<AlternativeId[]>([], {
        validators: [allAlternativeIdsComplete],
        nonNullable: true,
      }),
    }),
    files: new FormGroup({
      assetFiles: new FormArray<FormControl<FormAssetFile>>([]),
    }),
    contacts: new FormGroup({ assetContacts: new FormArray<FormControl<AssetContact>>([]) }),
    references: new FormGroup({
      mainAsset: new FormControl<LinkedAsset | null>(null),
      siblingAssets: new FormControl<LinkedAsset[]>([], { nonNullable: true }),
      subordinateAssets: new FormControl<LinkedAsset[]>([], { nonNullable: true }),
    }),
    geometries: new FormGroup({ studies: new FormControl<Studies>([], { nonNullable: true }) }),
    status: new FormGroup({}),
  });
};

export type AssetForm = ReturnType<typeof buildForm>;

export type AlternativeId = {
  idId: number | null;
  id: string;
  description: string;
};

export function allAlternativeIdsComplete(control: AbstractControl): ValidationErrors | null {
  const value = control.value as AlternativeId[];

  if (!Array.isArray(value)) {
    return { invalidFormat: true };
  }

  const hasInvalid = value.some(
    (item) => !item || typeof item !== 'object' || !item.id?.trim() || !item.description?.trim(),
  );

  return hasInvalid ? { incompleteAlternativeIds: true } : null;
}
