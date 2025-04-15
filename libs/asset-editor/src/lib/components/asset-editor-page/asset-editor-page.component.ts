import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, RouterStateSnapshot } from '@angular/router';
import {
  AppSharedState,
  ConfirmDialogComponent,
  CURRENT_LANG,
  fromAppShared,
  ROUTER_SEGMENTS,
  RoutingService,
} from '@asset-sg/client-shared';
import { AssetEditDetail, dateFromDateId, Lang } from '@asset-sg/shared';
import { Workflow } from '@asset-sg/shared/v2';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { Observable, Subscription, take, tap } from 'rxjs';
import { EditorMode } from '../../models';
import * as actions from '../../state/asset-editor.actions';
import { selectWorkflow } from '../../state/asset-editor.selector';
import { Tab } from '../asset-editor-navigation/asset-editor-navigation.component';

@UntilDestroy()
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

    this.subscriptions.add(
      this.store.select(fromAppShared.selectCurrentAsset).subscribe((asset) => {
        if (this.mode === EditorMode.Edit) {
          this.asset = asset;
        }
        this.initializeForm();
      }),
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
    this.routingService.navigateToRoot().then();
  }

  public initializeForm() {
    this.form.reset();
    this.form.controls.general.controls.titlePublic.setValue(this.asset?.titlePublic ?? null);
    this.form.controls.general.controls.titleOriginal.setValue(this.asset?.titleOriginal ?? null);
    this.form.controls.general.controls.workgroupId.setValue(this.asset?.workgroupId ?? null);
    this.form.controls.general.controls.creationDate.setValue(
      this.asset ? dateFromDateId(this.asset.createDate) : null
    );
    this.form.controls.general.controls.receiptDate.setValue(
      this.asset ? dateFromDateId(this.asset.receiptDate) : null
    );
    this.form.controls.general.controls.assetLanguages.setValue(this.asset?.assetLanguages ?? null);
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

  protected readonly Tab = Tab;
  protected readonly EditorMode = EditorMode;
}

const buildForm = () => {
  return new FormGroup({
    general: new FormGroup({
      titlePublic: new FormControl('', { validators: [Validators.required] }),
      titleOriginal: new FormControl(''),
      workgroupId: new FormControl<number | null>(null, { validators: [Validators.required] }),
      creationDate: new FormControl<Date | null>(null, { validators: [Validators.required] }),
      receiptDate: new FormControl<Date | null>(null, { validators: [Validators.required] }),
      assetLanguages: new FormControl<Array<{ languageItemCode: string }>>([], { validators: [Validators.required] }),
    }),
    files: new FormGroup({
      other: new FormControl('', { validators: [Validators.required] }),
    }),
    contacts: new FormGroup({}),
    references: new FormGroup({}),
    geometries: new FormGroup({}),
    altdaten: new FormGroup({}),
    status: new FormGroup({}),
  });
};

export type AssetForm = ReturnType<typeof buildForm>;
