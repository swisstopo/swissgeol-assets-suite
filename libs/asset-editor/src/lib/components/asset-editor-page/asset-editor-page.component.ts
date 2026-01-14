import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterStateSnapshot } from '@angular/router';
import { AssetSearchService } from '@asset-sg/asset-viewer';
import {
  AppSharedState,
  ConfirmDialogComponent,
  ConfirmDialogData,
  fromAppShared,
  LanguageService,
  ROUTER_SEGMENTS,
} from '@asset-sg/client-shared';
import { Geom, GeomFromGeomText, LV95, Studies, Study } from '@asset-sg/shared';
import {
  Asset,
  AssetContact,
  AssetData,
  AssetFile,
  AssetIdentifier,
  AssetIdentifierData,
  CreateAssetFileData,
  CreateGeometryData,
  DeleteGeometryData,
  GeometryData,
  GeometryDetail,
  GeometryId,
  GeometryMutationType,
  GeometryType,
  isDeepEqual,
  LanguageCode,
  LinkedAsset,
  LocalDate,
  LocalizedItemCode,
  mapGeometryTypeToStudyType,
  UpdateAssetFileData,
  UpdateGeometryData,
  Workflow,
  WorkflowStatus,
} from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import * as E from 'fp-ts/Either';
import { filter, map, Observable, Subscription, switchMap, take, tap } from 'rxjs';
import { EditorMode } from '../../models';
import { AssetEditorService } from '../../services/asset-editor.service';
import * as actions from '../../state/asset-editor.actions';
import { selectWorkflow } from '../../state/asset-editor.selector';
import { Tab } from '../asset-editor-navigation/asset-editor-navigation.component';
import { isExistingAssetFile } from '../asset-editor-tabs/asset-editor-files/asset-editor-files.component';
import {
  GeometryForm,
  makeGeometryForm,
} from '../asset-editor-tabs/asset-editor-geometry/asset-editor-geometries.component';

@Component({
  selector: 'asset-sg-editor-page',
  templateUrl: './asset-editor-page.component.html',
  styleUrls: ['./asset-editor-page.component.scss'],
  standalone: false,
})
export class AssetEditorPageComponent implements OnInit, OnDestroy {
  protected mode = EditorMode.Create;

  /**
   * The current asset. This is `null` while the asset is being loaded, or when a new asset is being created.
   */
  protected readonly asset = signal<Asset | null>(null);

  protected readonly assetPdfs = computed(() => {
    const asset = this.asset();
    if (asset === null) {
      return [];
    }

    return asset.files
      .filter((f) => isExistingAssetFile(f) && f.name.endsWith('.pdf'))
      .map((f) => ({
        id: f.id,
        fileName: f.alias ?? f.name,
      }));
  });
  protected readonly hasPdfs = computed(() => this.assetPdfs().length > 0);
  protected readonly showPdfViewer = signal(false);
  protected readonly pdfViewerInitialized = signal(false);

  /**
   * The current asset's geometries. This remains empty when an asset is being created.
   */
  protected geometries: GeometryDetail[] = [];

  /**
   * The asset's workflow. This is `null` while the workflow is being loaded, or when a new asset is being created.
   */
  protected workflow: Workflow | null = null;

  protected form!: AssetForm;

  /**
   * The form that controls the asset's geometries.
   * This is mapped to the `geometries` field in the {@link form}.
   *
   * Note that this only exists so we do not need to refactor the `asset-editor-geometries` component.
   * When that component is being replaced, this value should be removed.
   */
  protected geometryForm!: GeometryForm;

  protected activeTab: Tab = Tab.General;
  protected availableTabs: Tab[] = [];
  protected readonly WorkflowStatus = WorkflowStatus;
  protected isLoading = false;
  protected readonly Tab = Tab;
  protected readonly EditorMode = EditorMode;
  private readonly store = inject(Store<AppSharedState>);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialogService = inject(MatDialog);
  private readonly languageService = inject(LanguageService);
  private readonly assetEditorService = inject(AssetEditorService);
  private readonly assetSearchService = inject(AssetSearchService);
  private readonly routerSegments$ = inject(ROUTER_SEGMENTS);
  private readonly subscriptions: Subscription = new Subscription();

  get hasReferences(): boolean {
    return (
      this.form.controls.references.controls.parent.value !== null ||
      this.form.controls.references.controls.siblings.value.length > 0 ||
      this.form.controls.references.controls.children.value.length > 0
    );
  }

  public ngOnInit() {
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
    this.form = makeForm();
    this.connectGeometryForm();

    this.loadAssetFromRouteParams();

    this.subscriptions.add(
      this.store
        .select(fromAppShared.selectCurrentAssetAndGeometries)
        .pipe(
          tap((current) => {
            if (this.mode === EditorMode.Edit && current !== null) {
              const { asset, geometries } = current;
              this.asset.set(asset);
              this.geometries = geometries;
            }
            this.initializeTabs();
            this.initializeForm();
          }),
        )
        .subscribe(),
    );
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

  public navigateToStart() {
    this.router.navigate(['/']).then();
  }

  public initializeForm() {
    this.form.reset();
    const asset = this.asset();
    const { files, contacts } = this.form.controls;
    if (asset !== null) {
      files.clear();
      for (const file of asset.files) {
        files.push(
          new FormControl(
            {
              ...file,
              shouldBeDeleted: false,
            } satisfies AssetFormFile,
            { nonNullable: true },
          ),
        );
      }

      contacts.clear();
      for (const contact of asset.contacts) {
        contacts.push(new FormControl(contact, { nonNullable: true }));
      }

      let restrictionType: RestrictionType = RestrictionType.Restricted;
      if (asset.isPublic) {
        restrictionType = RestrictionType.Public;
      } else if (asset.restrictionDate) {
        restrictionType = RestrictionType.TemporarilyRestricted;
      }

      this.form.controls.general.setValue({
        title: asset.title,
        originalTitle: asset.originalTitle,
        languageCodes: asset.languageCodes,
        formatCode: asset.formatCode,
        kindCode: asset.kindCode,
        topicCodes: asset.topicCodes,
        isOfNationalInterest: asset.isOfNationalInterest,
        nationalInterestTypeCodes: asset.nationalInterestTypeCodes,
        identifiers: asset.identifiers,
        workgroupId: asset.workgroupId,
        createdAt: asset.createdAt.toDate(),
        receivedAt: asset.receivedAt.toDate(),
        restrictionType: restrictionType,
        restrictionDate: asset.restrictionDate?.toDate() ?? null,
      });

      this.form.controls.references.setValue({
        parent: asset.parent,
        siblings: asset.siblings,
        children: asset.children,
      });

      this.form.controls.geometries.setValue([]);
    }
  }

  public openConfirmDialogForAssetDeletion(assetId: number): void {
    const dialogRef = this.dialogService.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          text: 'confirmDelete',
          confirm: 'confirm',
        },
      },
    );
    dialogRef.afterClosed().subscribe((hasConfirmed) => {
      if (hasConfirmed) {
        this.store.dispatch(actions.deleteAsset({ assetId }));
      }
    });
  }

  public save(): void {
    this.subscriptions.add(
      this.setupSaveBehaviour().subscribe(({ asset, geometries }) => {
        this.isLoading = false;
        if (this.mode === EditorMode.Create) {
          // When the asset has just been created, then we want to navigate to its edit page.
          // Note that this won't reload this component - it's simply a "cosmetic" change.
          this.router.navigate([this.languageService.language, 'asset-admin', asset.id], { replaceUrl: true }).then();
        }
        this.mode = EditorMode.Edit;
        this.store.dispatch(actions.updateAsset({ asset, geometries }));
      }),
    );
  }

  public canDeactivate(targetRoute: RouterStateSnapshot): boolean | Observable<boolean> {
    if (
      this.form === undefined ||
      !this.form.dirty ||
      targetRoute.url.startsWith(`/${this.languageService.language}/asset-admin/${this.asset()?.id ?? 'new'}`)
    ) {
      return true;
    }
    const dialogRef = this.dialogService.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          text: this.form.invalid ? 'edit.questionAbortChanges' : 'edit.questionDiscardChanges',
          confirm: 'save',
          isSaveDisabled: this.form.invalid,
        },
      },
    );
    return dialogRef.afterClosed().pipe(
      filter((hasConfirmed) => !!hasConfirmed),
      switchMap(() => {
        return this.setupSaveBehaviour().pipe(map(() => true));
      }),
    );
  }

  protected togglePdfViewer() {
    const newValue = !this.showPdfViewer();
    this.showPdfViewer.set(newValue);
    if (newValue) {
      this.pdfViewerInitialized.set(true);
    }
  }

  private connectGeometryForm(): void {
    this.geometryForm = makeGeometryForm();

    let lastKnownGeometries: GeometryData[] = [];
    this.form.controls.geometries.valueChanges.subscribe((geometries) => {
      if (lastKnownGeometries === geometries) {
        return;
      }
      lastKnownGeometries = geometries;

      const studyMapping: Map<string, Study> = new Map();
      for (const geometry of this.geometries) {
        studyMapping.set(geometry.id, {
          studyId: geometry.id,
          geom:
            geometry.type === GeometryType.Point
              ? { _tag: 'Point', coord: geometry.coordinates[0] as LV95 }
              : {
                  _tag: geometry.type as 'LineString' | 'Polygon',
                  coords: geometry.coordinates as LV95[],
                },
        });
      }
      let id = 0;
      for (const geometry of geometries) {
        let studyId: string;
        switch (geometry.mutation) {
          case GeometryMutationType.Create:
            studyId = `study_${mapGeometryTypeToStudyType(geometry.type)}_new_${id++}`;
            break;
          case GeometryMutationType.Update:
            studyId = geometry.id;
            break;
          case GeometryMutationType.Delete:
            // Deletion is represented as absence.
            studyMapping.delete(geometry.id);
            continue;
        }
        const geom = GeomFromGeomText.decode(geometry.text);
        studyMapping.set(studyId, {
          studyId,
          geom: (geom as E.Right<Geom>).right,
        });
      }

      lastKnownStudies = [...studyMapping.values()];
      this.geometryForm.controls.studies.setValue(lastKnownStudies);
    });

    let lastKnownStudies: Studies = [];
    this.geometryForm.controls.studies.valueChanges.subscribe((studies) => {
      if (lastKnownStudies === studies) {
        return;
      }
      lastKnownStudies = studies;

      const knownIds = new Set<GeometryId>();
      const newGeometries: GeometryData[] = [];
      for (const study of studies) {
        if (study.studyId.includes('_new_')) {
          newGeometries.push({
            mutation: GeometryMutationType.Create,
            type: study.geom._tag as GeometryType,
            text: GeomFromGeomText.encode(study.geom),
          } satisfies CreateGeometryData);
          continue;
        }
        const id = study.studyId as GeometryId;
        knownIds.add(id);

        const studyCoordinates = study.geom._tag === 'Point' ? [study.geom.coord] : study.geom.coords;
        const geometryCoordinates = this.geometries.find((it) => it.id === id)?.coordinates;
        if (isDeepEqual(studyCoordinates, geometryCoordinates)) {
          // If the saved and updated coordinates are the same,
          // then we don't need to send an update to the server.
          continue;
        }
        newGeometries.push({
          mutation: GeometryMutationType.Update,
          id,
          text: GeomFromGeomText.encode(study.geom),
        } satisfies UpdateGeometryData);
      }

      const deletedGeometries = this.geometries
        .filter((geometry) => !knownIds.has(geometry.id))
        .map(
          (geometry): DeleteGeometryData => ({
            mutation: GeometryMutationType.Delete,
            id: geometry.id,
          }),
        );

      lastKnownGeometries = [...newGeometries, ...deletedGeometries];
      this.form.controls.geometries.setValue(lastKnownGeometries);
      this.form.controls.geometries.markAsDirty();
    });
  }

  private initializeTabs() {
    this.availableTabs = Object.values(Tab);
    if (this.asset()?.legacyData == null) {
      this.availableTabs.splice(this.availableTabs.indexOf(Tab.LegacyData), 1);
    }
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

  private setupSaveBehaviour(): Observable<{ asset: Asset; geometries: GeometryDetail[] }> {
    const asset = this.asset();
    if (!this.asset && this.mode === EditorMode.Edit) {
      throw new Error('missing asset');
    }

    const { general, geometries, contacts, references, files } = this.form.getRawValue();

    const filesToCreate: CreateAssetFileData[] = [];
    const filesToUpdate: UpdateAssetFileData[] = [];
    for (const entry of files) {
      if ('id' in entry) {
        if (!entry.shouldBeDeleted) {
          filesToUpdate.push({
            id: entry.id,
            legalDocCode: entry.legalDocCode,
            pageRangeClassifications: entry.pageRangeClassifications,
          });
        }
      } else if (!entry.shouldBeDeleted) {
        filesToCreate.push({
          file: entry.file,
          legalDocCode: entry.legalDocCode,
        });
      }
    }

    let restrictionDate: LocalDate | null = general.restrictionDate
      ? LocalDate.fromDate(general.restrictionDate)
      : null;
    if (general.restrictionType !== RestrictionType.TemporarilyRestricted) {
      restrictionDate = null;
    }

    const data: AssetData = {
      title: general.title,
      originalTitle: general.originalTitle,
      isOfNationalInterest: general.isOfNationalInterest,
      isPublic: general.restrictionType === RestrictionType.Public,
      restrictionDate,
      formatCode: general.formatCode,
      kindCode: general.kindCode,
      languageCodes: general.languageCodes,
      nationalInterestTypeCodes: general.nationalInterestTypeCodes,
      topicCodes: general.topicCodes,
      identifiers: general.identifiers,
      contacts,
      parent: references.parent?.id ?? null,
      siblings: references.siblings.map((it) => it.id),
      workgroupId: general.workgroupId,
      createdAt: LocalDate.fromDate(general.createdAt ?? new Date()),
      receivedAt: LocalDate.fromDate(general.receivedAt ?? new Date()),
    };

    this.isLoading = true;

    // The request to create or update the asset.
    const formSubmission$ =
      asset !== null && this.mode === EditorMode.Edit
        ? this.assetEditorService.updateAsset(asset.id, {
            ...data,
            files: filesToUpdate,
            geometries,
          })
        : this.assetEditorService.createAsset({ ...data, geometries: geometries as CreateGeometryData[] });

    return formSubmission$.pipe(
      // After the form has been saved, upload the new files.
      switchMap((newAsset) =>
        this.assetEditorService
          .uploadFilesForAsset(newAsset.id, filesToCreate)
          .pipe(map((newFiles) => ({ ...newAsset, files: [...newAsset.files, ...newFiles] }))),
      ),

      // Fetch the updated geometries.
      // Note that we could update the geometries manually,
      // though this is a lot simpler and less error-prone,
      // at the cost of performance.
      switchMap((asset) =>
        this.assetSearchService.fetchGeometries(asset.id).pipe(
          map((geometries) => ({
            asset,
            geometries,
          })),
        ),
      ),
    );
  }
}

export type ExistingAssetFile = Pick<
  AssetFile,
  'id' | 'name' | 'legalDocCode' | 'lastModifiedAt' | 'pageRangeClassifications' | 'pageCount'
> & {
  shouldBeDeleted: boolean;
};

export type AssetFormFile =
  | ExistingAssetFile
  | (CreateAssetFileData & {
      shouldBeDeleted: boolean;
    });

const makeForm = () =>
  new FormGroup({
    general: new FormGroup({
      workgroupId: new FormControl(null as unknown as number, { validators: [Validators.required], nonNullable: true }),
      title: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
      originalTitle: new FormControl(''),
      createdAt: new FormControl<Date | null>(null, { validators: [Validators.required] }),
      receivedAt: new FormControl<Date | null>(null, { validators: [Validators.required] }),
      languageCodes: new FormControl<LanguageCode[]>([], { nonNullable: true }),
      formatCode: new FormControl<LocalizedItemCode>('', { validators: [Validators.required], nonNullable: true }),
      kindCode: new FormControl<LocalizedItemCode>('', { validators: [Validators.required], nonNullable: true }),
      topicCodes: new FormControl<LocalizedItemCode[]>([], { validators: [Validators.required], nonNullable: true }),
      restrictionType: new FormControl<RestrictionType>(RestrictionType.Restricted, { nonNullable: true }),
      restrictionDate: new FormControl<Date | null>(null),
      isOfNationalInterest: new FormControl<boolean>(false, { nonNullable: true }),
      nationalInterestTypeCodes: new FormControl<LocalizedItemCode[]>([], { nonNullable: true }),
      identifiers: new FormControl<Array<AssetIdentifier | AssetIdentifierData>>([], {
        validators: [validateIdentifiers],
        nonNullable: true,
      }),
    }),
    files: new FormArray<FormControl<AssetFormFile>>([]),
    contacts: new FormArray<FormControl<AssetContact>>([]),
    references: new FormGroup({
      parent: new FormControl<LinkedAsset | null>(null),
      siblings: new FormControl<LinkedAsset[]>([], { nonNullable: true }),
      children: new FormControl<LinkedAsset[]>([], { nonNullable: true }),
    }),
    geometries: new FormControl<GeometryData[]>([], { nonNullable: true }),
  });

export type AssetForm = ReturnType<typeof makeForm>;

export enum RestrictionType {
  Public = 'public',
  Restricted = 'restricted',
  TemporarilyRestricted = 'temporarilyRestricted',
}

export function validateIdentifiers(control: AbstractControl): ValidationErrors | null {
  const value = control.value as Array<AssetIdentifier | AssetIdentifierData>;
  if (!Array.isArray(value)) {
    return { invalidFormat: true };
  }
  const hasInvalid = value.some(
    (item) =>
      !item || typeof item !== 'object' || item.value.trim().length === 0 || item.description.trim().length === 0,
  );

  return hasInvalid ? { incompleteAlternativeIds: true } : null;
}
