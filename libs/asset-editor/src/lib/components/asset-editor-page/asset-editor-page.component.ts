import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterStateSnapshot } from '@angular/router';
import {
  AppSharedState,
  ConfirmDialogComponent,
  ConfirmDialogData,
  CURRENT_LANG,
  fromAppShared,
  ROUTER_SEGMENTS,
  RoutingService,
} from '@asset-sg/client-shared';
import { Lang } from '@asset-sg/shared';
import {
  Asset,
  AssetContact,
  AssetData,
  AssetFile,
  AssetIdentifier,
  AssetIdentifierData,
  CreateAssetFileData,
  CreateGeometryData,
  GeometryData,
  LinkedAsset,
  LocalDate,
  LocalizedItemCode,
  UpdateAssetFileData,
  Workflow,
} from '@asset-sg/shared/v2';
import { untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { filter, map, Observable, Subscription, switchMap, take, tap } from 'rxjs';
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
  public asset: Asset | null = null;

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

  get hasReferences(): boolean {
    return (
      this.form.controls.references.controls.parent.value !== null ||
      this.form.controls.references.controls.siblings.value.length > 0 ||
      this.form.controls.references.controls.children.value.length > 0
    );
  }

  public navigateToStart() {
    this.routingService.navigateToRoot().then();
  }

  public initializeForm() {
    this.form.reset();
    const { asset } = this;
    if (asset !== null) {
      this.form.setValue({
        general: {
          ...asset,
          createdAt: asset.createdAt.toDate(),
          receivedAt: asset.receivedAt.toDate(),
        },
        files: asset.files.map(
          (file) =>
            ({
              ...file,
              shouldBeDeleted: false,
            }) satisfies ExistingAssetFile,
        ),
        references: asset,
        geometries: [],
        contacts: asset.contacts,
      });
    }
  }

  public openConfirmDialogForAssetDeletion(assetId: number): void {
    const dialogRef = this.dialogService.open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, {
      data: {
        text: 'confirmDelete',
        confirm: 'confirm',
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

  public save(): void {
    const asset = this.asset;
    if (!this.asset && this.mode === EditorMode.Edit) {
      return;
    }

    const { general, geometries, contacts, references, files } = this.form.getRawValue();

    const filesToCreate: CreateAssetFileData[] = [];
    const filesToUpdate: UpdateAssetFileData[] = [];
    for (const entry of files) {
      if ('shouldBeDeleted' in entry) {
        if (!entry.shouldBeDeleted) {
          filesToUpdate.push({
            id: entry.id,
            legalDocCode: entry.legalDocCode,
          });
        }
      } else {
        filesToCreate.push(entry);
      }
    }

    const data: AssetData = {
      title: general.title,
      originalTitle: general.originalTitle,
      isOfNationalInterest: general.isOfNationalInterest,
      isPublic: false, // todo @TIL-EBP: this should be changed dynamically
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
    this.subscriptions.add(
      asset === null
        ? this.assetEditorService
            .createAsset({ ...data, geometries: geometries as CreateGeometryData[] })
            .pipe(
              switchMap((newAsset) =>
                this.assetEditorService
                  .uploadFilesForAsset(newAsset.id, filesToCreate)
                  .pipe(map((files) => ({ ...newAsset, files }))),
              ),
            )
            .subscribe((asset) => {
              this.isLoading = false;
              this.form.markAsPristine();
              this.asset = asset;
              this.mode = EditorMode.Edit;
              this.store.dispatch(actions.updateAssetResult({ asset }));
              this.router.navigate([this.currentLang, 'asset-admin', asset.id], { replaceUrl: true }).then();
            })
        : this.assetEditorService
            .uploadFilesForAsset(asset.id, filesToCreate)
            .pipe(
              switchMap(() =>
                this.assetEditorService.updateAsset(asset.id, { ...data, files: filesToUpdate, geometries }),
              ),
            )
            .subscribe((asset) => {
              this.isLoading = false;
              this.form.markAsPristine();
              this.store.dispatch(actions.updateAssetResult({ asset }));
            }),
    );
  }

  public canDeactivate(targetRoute: RouterStateSnapshot): boolean | Observable<boolean> {
    if (
      this.form === undefined ||
      !this.form.dirty ||
      targetRoute.url.startsWith(`/${this.currentLang}/asset-admin/${this.asset?.id ?? 'new'}`)
    ) {
      return true;
    }
    const dialogRef = this.dialogService.open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, {
      data: {
        text: 'edit.questionDiscardChanges',
        confirm: 'save',
      },
    });
    return dialogRef.afterClosed();
  }

  private initializeTabs() {
    this.availableTabs = Object.values(Tab);
    if (this.asset?.legacyData == null) {
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
}

export type ExistingAssetFile = Pick<AssetFile, 'id' | 'name' | 'legalDocCode'> & {
  shouldBeDeleted: boolean;
};

export type AssetFormFile = ExistingAssetFile | CreateAssetFileData;

const buildForm = () =>
  new FormGroup({
    general: new FormGroup({
      workgroupId: new FormControl(null as unknown as number, { validators: [Validators.required], nonNullable: true }),
      title: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
      originalTitle: new FormControl(''),
      createdAt: new FormControl<Date | null>(null, { validators: [Validators.required] }),
      receivedAt: new FormControl<Date | null>(null, { validators: [Validators.required] }),
      languageCodes: new FormControl<LocalizedItemCode[]>([], { nonNullable: true }),
      formatCode: new FormControl<LocalizedItemCode>('', { validators: [Validators.required], nonNullable: true }),
      kindCode: new FormControl<LocalizedItemCode>('', { validators: [Validators.required], nonNullable: true }),
      topicCodes: new FormControl<LocalizedItemCode[]>([], { validators: [Validators.required], nonNullable: true }),
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

export type AssetForm = ReturnType<typeof buildForm>;

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
