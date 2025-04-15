import { inject, Injectable } from '@angular/core';
import { Alert, AlertType, appSharedStateActions, RoutingService, showAlert } from '@asset-sg/client-shared';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import { map, switchMap } from 'rxjs';
import { AssetEditorService } from '../services/asset-editor.service';
import * as actions from './asset-editor.actions';

@UntilDestroy()
@Injectable()
export class AssetEditorEffects {
  private readonly _actions$ = inject(Actions);
  private readonly _assetEditorService = inject(AssetEditorService);
  private readonly routingService = inject(RoutingService);
  private readonly translateService = inject(TranslateService);

  loadAsset$ = createEffect(() =>
    this._actions$.pipe(
      ofType(actions.loadAsset),
      switchMap(({ assetId }) => this._assetEditorService.loadAsset(assetId)),
      map((asset) => appSharedStateActions.setCurrentAsset({ asset })),
    ),
  );

  createAsset$ = createEffect(() =>
    this._actions$.pipe(
      ofType(actions.createNewAsset),
      switchMap(({ patchAsset }) => this._assetEditorService.createAsset(patchAsset)),
      map((data) => actions.updateAssetEditDetailResult({ asset: data })),
    ),
  );

  updateAssetEditDetail$ = createEffect(() =>
    this._actions$.pipe(
      ofType(actions.updateAssetEditDetail),
      switchMap(({ assetId, patchAsset, newFiles, filesToDelete }) =>
        this._assetEditorService.deleteFiles(assetId, filesToDelete).pipe(
          switchMap(() => this._assetEditorService.uploadFiles(assetId, newFiles)),
          switchMap(() => this._assetEditorService.updateAssetDetail(assetId, patchAsset)),
        ),
      ),
      map((asset) => actions.updateAssetEditDetailResult({ asset })),
    ),
  );

  deleteAsset$ = createEffect(() =>
    this._actions$.pipe(
      ofType(actions.deleteAsset),
      switchMap(({ assetId }) => this._assetEditorService.deleteAsset(assetId).pipe(map(() => assetId))),
      map((assetId) => actions.handleSuccessfulDeletion({ assetId })),
    ),
  );

  displayAlertAfterDeletion$ = createEffect(() =>
    this._actions$.pipe(
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
    this._actions$.pipe(
      ofType(actions.handleSuccessfulDeletion),
      switchMap(async ({ assetId }) => {
        await this.routingService.navigateToRoot();
        return assetId;
      }),
      map((assetId) => appSharedStateActions.removeAsset({ assetId })),
    ),
  );

  updateSearchAfterAssetChanged$ = createEffect(() =>
    this._actions$.pipe(
      ofType(actions.updateAssetEditDetailResult),
      map(({ asset }) =>
        appSharedStateActions.updateAsset({
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

  createContact$ = createEffect(() =>
    this._actions$.pipe(
      ofType(actions.createContact),
      switchMap(({ contact }) => this._assetEditorService.createContact(contact)),
      map(appSharedStateActions.createContactResult),
    ),
  );

  updateContact$ = createEffect(() =>
    this._actions$.pipe(
      ofType(actions.editContact),
      switchMap(({ contact }) => this._assetEditorService.updateContact(contact.id, contact)),
      map(appSharedStateActions.editContactResult),
    ),
  );
}
