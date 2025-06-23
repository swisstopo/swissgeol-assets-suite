import { inject, Injectable } from '@angular/core';
import {
  Alert,
  AlertType,
  appSharedStateActions,
  fromAppShared,
  RoutingService,
  showAlert,
} from '@asset-sg/client-shared';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { filter, map, switchMap, withLatestFrom } from 'rxjs';
import { AssetEditorService } from '../services/asset-editor.service';
import { WorkflowApiService } from '../services/workflow-api.service';
import * as actions from './asset-editor.actions';
import { setWorkflow } from './asset-editor.actions';

@UntilDestroy()
@Injectable()
export class AssetEditorEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly assetEditorService = inject(AssetEditorService);
  private readonly workflowApiService = inject(WorkflowApiService);
  private readonly routingService = inject(RoutingService);
  private readonly translateService = inject(TranslateService);

  loadAsset$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.loadAsset),
      withLatestFrom(this.store.select(fromAppShared.selectCurrentAsset)),
      filter(([{ assetId }, asset]) => asset?.assetId !== assetId),
      switchMap(([{ assetId }]) => this.assetEditorService.fetchAsset(assetId)),
      map((asset) => appSharedStateActions.setCurrentAsset({ asset })),
    ),
  );

  loadWorkflow$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.loadAsset),
      switchMap(({ assetId }) => this.workflowApiService.fetchWorkflow(assetId)),
      map((workflow) => setWorkflow({ workflow })),
    ),
  );

  createAsset$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.createNewAsset),
      switchMap(({ patchAsset }) => this.assetEditorService.createAsset(patchAsset)),
      map((data) => actions.updateAssetEditDetailResult({ asset: data })),
    ),
  );

  updateAssetEditDetail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.updateAssetEditDetail),
      switchMap(({ assetId, patchAsset, newFiles, filesToDelete }) =>
        this.assetEditorService.deleteFiles(assetId, filesToDelete).pipe(
          switchMap(() => this.assetEditorService.uploadFiles(assetId, newFiles)),
          switchMap(() => this.assetEditorService.updateAssetDetail(assetId, patchAsset)),
        ),
      ),
      map((asset) => actions.updateAssetEditDetailResult({ asset })),
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
        await this.routingService.navigateToRoot();
        return assetId;
      }),
      map((assetId) => appSharedStateActions.removeAsset({ assetId })),
    ),
  );

  updateSearchAfterAssetChanged$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.updateAssetEditDetailResult),
      map(({ asset }) =>
        appSharedStateActions.updateAsset({
          shouldBeCurrentAsset: true,
          asset: {
            ...asset,
            studies: asset.studies.map((it) => ({
              assetId: asset.assetId,
              studyId: it.studyId,
              geomText: it.geomText,
            })),
          },
        }),
      ),
    ),
  );
}
