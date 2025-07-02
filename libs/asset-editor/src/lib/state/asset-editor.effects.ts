import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AssetSearchService } from '@asset-sg/asset-viewer';
import { Alert, AlertType, appSharedStateActions, fromAppShared, showAlert } from '@asset-sg/client-shared';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { filter, firstValueFrom, map, switchMap, withLatestFrom } from 'rxjs';
import { AssetEditorService } from '../services/asset-editor.service';
import { WorkflowApiService } from '../services/workflow-api.service';
import * as actions from './asset-editor.actions';
import { setWorkflow } from './asset-editor.actions';

@UntilDestroy()
@Injectable()
export class AssetEditorEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly assetEditorService = inject(AssetEditorService);
  private readonly assetSearchService = inject(AssetSearchService);
  private readonly workflowApiService = inject(WorkflowApiService);
  private readonly translateService = inject(TranslateService);

  loadAsset$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.loadAsset),
      withLatestFrom(this.store.select(fromAppShared.selectCurrentAsset)),
      filter(([{ assetId }, asset]) => asset?.id !== assetId),
      switchMap(([{ assetId }]) =>
        Promise.all([
          firstValueFrom(this.assetSearchService.fetchAsset(assetId)),
          firstValueFrom(this.assetSearchService.fetchGeometries(assetId)),
        ]),
      ),
      map(([asset, geometries]) =>
        appSharedStateActions.setCurrentAsset({ asset: { asset, geometries }, isLoading: false }),
      ),
    ),
  );

  loadWorkflow$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.loadWorkflow, actions.loadAsset),
      switchMap(({ assetId }) => this.workflowApiService.fetchWorkflow(assetId)),
      map((workflow) => setWorkflow({ workflow })),
    ),
  );

  deleteAsset$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.deleteAsset),
      switchMap(({ assetId }) => this.assetEditorService.deleteAsset(assetId).pipe(map(() => assetId))),
      map((assetId) => actions.handleSuccessfulDeletion({ assetId })),
    ),
  );

  displayAlertAfterDeletion$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.handleSuccessfulDeletion),
      map(() => {
        const alert: Alert = {
          type: AlertType.Success,
          text: this.translateService.instant('deleteSuccess'),
          id: 'asset-deleted',
          isPersistent: false,
        };
        return showAlert({ alert });
      }),
    ),
  );

  redirectToViewerAfterDeletion = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.handleSuccessfulDeletion),
      switchMap(async ({ assetId }) => {
        await this.router.navigate(['/']);
        return assetId;
      }),
      map((assetId) => appSharedStateActions.removeAsset({ assetId })),
    ),
  );

  updateSearchAfterAssetChanged$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.updateAsset),
      map(({ asset, geometries }) =>
        appSharedStateActions.updateAsset({
          shouldBeCurrentAsset: true,
          asset,
          geometries,
        }),
      ),
    ),
  );

  fetchWorkflowAfterAssetChanged$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.updateAsset),
      map(({ asset }) => actions.loadWorkflow({ assetId: asset.id })),
    ),
  );
}
