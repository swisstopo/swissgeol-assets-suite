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
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { Observable, Subscription, take, tap, withLatestFrom } from 'rxjs';
import * as actions from '../../state/asset-editor.actions';
import { Tab } from '../asset-editor-navigation/asset-editor-navigation.component';

@UntilDestroy()
@Component({
  selector: 'asset-sg-editor-page',
  templateUrl: './asset-editor-page.component.html',
  styleUrls: ['./asset-editor-page.component.scss'],
  standalone: false,
})
export class AssetEditorPageComponent implements OnInit, OnDestroy {
  public mode: 'edit' | 'create' = 'edit';
  // When creating a new asset, the asset is null
  public asset: AssetEditDetail | null = null;
  public form!: AssetForm;
  public activeTab: Tab = Tab.General;
  private currentLang: Lang = 'de';
  private readonly store = inject(Store<AppSharedState>);
  private readonly route = inject(ActivatedRoute);
  private readonly routingService = inject(RoutingService);
  private readonly dialogService = inject(MatDialog);
  private readonly currentLang$ = inject(CURRENT_LANG);
  private readonly routerSegments$ = inject(ROUTER_SEGMENTS);

  private readonly assetEditDetail$ = this.store.select(fromAppShared.selectCurrentAsset);
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
      this.assetEditDetail$.subscribe((assetDetail) => {
        if (this.mode === 'edit') {
          this.asset = assetDetail;
        }
        this.initializeForm();
      }),
    );
  }

  public ngOnDestroy() {
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
      this.asset ? dateFromDateId(this.asset.createDate) : null,
    );
    this.form.controls.general.controls.receiptDate.setValue(
      this.asset ? dateFromDateId(this.asset.receiptDate) : null,
    );
    this.form.controls.general.controls.assetLanguages.setValue(this.asset?.assetLanguages ?? null);
    this.form.controls.general.controls.assetFormatItemCode.setValue(this.asset?.assetFormatItemCode ?? null);
    this.form.controls.general.controls.assetKindItemCode.setValue(this.asset?.assetKindItemCode ?? null);
    this.form.controls.general.controls.manCatLabelRefs.setValue(this.asset?.manCatLabelRefs ?? null);
    this.form.controls.general.controls.isNatRel.setValue(this.asset?.isNatRel ?? false);
    this.form.controls.general.controls.typeNatRels.setValue(this.asset?.typeNatRels ?? []);
    this.form.controls.general.controls.ids.setValue(this.asset?.ids ?? []);
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
    if (!this.form.dirty || targetRoute.url.startsWith(`/${this.currentLang}/asset-admin/${this.asset?.assetId}`)) {
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
      this.route.paramMap
        .pipe(withLatestFrom(this.store.select(fromAppShared.selectCurrentAsset)), take(1))
        .subscribe(([params, currentAsset]) => {
          const assetIdFromParam = params.get('assetId');
          if (!assetIdFromParam) {
            return;
          }
          const assetId = parseInt(assetIdFromParam);
          if (isNaN(assetId)) {
            this.mode = 'create';
            return;
          }

          if (currentAsset?.assetId === assetId) {
            this.asset = currentAsset;
          } else {
            this.store.dispatch(actions.loadAsset({ assetId }));
          }
        }),
    );
  }

  protected readonly Tab = Tab;
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
      ids: new FormControl<AlternativeId[]>([], { validators: [Validators.required], nonNullable: true }),
    }),
    files: new FormGroup({}),
    contacts: new FormGroup({}),
    references: new FormGroup({}),
    geometries: new FormGroup({}),
    altdaten: new FormGroup({}),
    status: new FormGroup({}),
  });
};

export type AssetForm = ReturnType<typeof buildForm>;

export type AlternativeId = {
  idId: number | null;
  id: string;
  description: string;
};
