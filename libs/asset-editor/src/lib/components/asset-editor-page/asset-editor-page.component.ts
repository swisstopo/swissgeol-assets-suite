import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, RouterStateSnapshot } from '@angular/router';
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
  hasHistoricalData,
  Lang,
  LinkedAsset,
  Studies,
} from '@asset-sg/shared';
import { AssetContact, Workflow } from '@asset-sg/shared/v2';
import { untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import * as O from 'fp-ts/lib/Option';
import { filter, Observable, Subscription, take, tap } from 'rxjs';
import { EditorMode } from '../../models';
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
  protected readonly Tab = Tab;
  protected readonly EditorMode = EditorMode;
  private currentLang: Lang = 'de';
  private readonly store = inject(Store<AppSharedState>);
  private readonly route = inject(ActivatedRoute);
  private readonly routingService = inject(RoutingService);
  private readonly dialogService = inject(MatDialog);
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
            take(1),
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

  public navigateToStart() {
    this.routingService.navigateToRoot().then();
  }

  public initializeForm() {
    this.form.reset();
    const {
      general: { controls: general },
      contacts: { controls: contacts },
    } = this.form.controls;
    general.titlePublic.setValue(this.asset?.titlePublic ?? null);
    general.titleOriginal.setValue(this.asset?.titleOriginal ?? null);
    general.workgroupId.setValue(this.asset?.workgroupId ?? null);
    general.creationDate.setValue(this.asset ? dateFromDateId(this.asset.createDate) : null);
    general.receiptDate.setValue(this.asset ? dateFromDateId(this.asset.receiptDate) : null);
    general.assetLanguages.setValue(this.asset?.assetLanguages ?? null);
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

  public canDeactivate(targetRoute: RouterStateSnapshot): boolean | Observable<boolean> {
    if (
      this.form === undefined ||
      !this.form.dirty ||
      targetRoute.url.startsWith(`/${this.currentLang}/asset-admin/${this.asset?.assetId}`)
    ) {
      return true;
    }
    const dialogRef = this.dialogService.open<ConfirmDialogComponent>(ConfirmDialogComponent, {
      data: {
        text: 'confirmDiscardChanges',
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
      titlePublic: new FormControl('', { validators: [Validators.required] }),
      titleOriginal: new FormControl(''),
      creationDate: new FormControl<Date | null>(null, { validators: [Validators.required] }),
      receiptDate: new FormControl<Date | null>(null, { validators: [Validators.required] }),
      assetLanguages: new FormControl<Array<{ languageItemCode: string }>>([]),
      assetFormatItemCode: new FormControl<string>('', { validators: [Validators.required] }),
      assetKindItemCode: new FormControl<string>('', { validators: [Validators.required] }),
      manCatLabelRefs: new FormControl<string[]>([], { validators: [Validators.required] }),
      isNatRel: new FormControl<boolean>(false),
      typeNatRels: new FormControl<string[]>([]),
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
