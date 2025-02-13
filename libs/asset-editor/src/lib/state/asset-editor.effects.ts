import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  Alert,
  AlertType,
  appSharedStateActions,
  filterNavigateToComponent,
  RoutingService,
  showAlert,
} from '@asset-sg/client-shared';
import { DT, isNotNull, ORD, partitionEither } from '@asset-sg/core';
import { GeomFromGeomText } from '@asset-sg/shared';
import * as RD from '@devexperts/remote-data-ts';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as D from 'io-ts/Decoder';
import { concatMap, filter, map, Observable, partition, share, switchMap, tap } from 'rxjs';

import { AssetEditorPageComponent } from '../components/asset-editor-page';
import { AssetEditorService } from '../services/asset-editor.service';

import * as actions from './asset-editor.actions';

@UntilDestroy()
@Injectable()
export class AssetEditorEffects {
  private readonly _actions$ = inject(Actions);
  private readonly _assetEditorService = inject(AssetEditorService);
  private readonly _router = inject(Router);
  private readonly routingService = inject(RoutingService);
  private readonly translateService = inject(TranslateService);

  validatedQueryParams = partitionEither(
    filterNavigateToComponent(this._actions$, AssetEditorPageComponent).pipe(
      map(({ params }) => pipe(D.struct({ assetId: D.union(DT.NumberFromString, D.literal('new')) }).decode(params))),
      share()
    )
  );

  navigateForInvalidQueryParams$ = createEffect(
    () =>
      this.validatedQueryParams[0].pipe(
        concatMap((e) => {
          console.error('error decoding queryParams', D.draw(e));
          return this._router.navigate(['/'], { queryParams: undefined });
        })
      ),
    { dispatch: false }
  );

  newOrAssetId = partition(this.validatedQueryParams[1], ({ assetId }) => assetId === 'new') as [
    Observable<{ assetId: 'new' }>,
    Observable<{ assetId: number }>
  ];

  newAsset$ = createEffect(() =>
    this.newOrAssetId[0].pipe(map(() => actions.loadAssetEditDetailResult(RD.success(O.none))))
  );

  loadAssetEditDetail$ = createEffect(() =>
    this.newOrAssetId[1].pipe(
      switchMap((params) => this._assetEditorService.loadAssetDetailData(params.assetId)),
      tap(async (rd) => {
        if (RD.isFailure(rd)) {
          await this._router.navigate(['/'], { queryParams: undefined });
        }
      }),
      ORD.map(O.some),
      map(actions.loadAssetEditDetailResult)
    )
  );

  createAsset$ = createEffect(() =>
    this._actions$.pipe(
      ofType(actions.createNewAsset),
      switchMap(({ patchAsset }) => this._assetEditorService.createAsset(patchAsset)),
      map((data) => actions.updateAssetEditDetailResult({ data }))
    )
  );

  updateAssetEditDetail$ = createEffect(() =>
    this._actions$.pipe(
      ofType(actions.updateAssetEditDetail),
      switchMap(({ assetId, patchAsset, newFiles, filesToDelete }) =>
        this._assetEditorService.deleteFiles(assetId, filesToDelete).pipe(
          ORD.chainSwitchMapW(() => this._assetEditorService.uploadFiles(assetId, newFiles)),
          ORD.chainSwitchMapW(() => this._assetEditorService.updateAssetDetail(assetId, patchAsset))
        )
      ),
      map((data) => actions.updateAssetEditDetailResult({ data }))
    )
  );

  deleteAsset$ = createEffect(() =>
    this._actions$.pipe(
      ofType(actions.deleteAsset),
      switchMap(({ assetId }) => this._assetEditorService.deleteAsset(assetId).pipe(map(() => assetId))),
      map((assetId) => actions.handleSuccessfulDeletion({ assetId }))
    )
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
      })
    )
  );

  redirectToViewerAfterDeletion = createEffect(() =>
    this._actions$.pipe(
      ofType(actions.handleSuccessfulDeletion),
      switchMap(async ({ assetId }) => {
        await this.routingService.navigateToRoot();
        return assetId;
      }),
      map((assetId) => appSharedStateActions.removeAssetFromSearch({ assetId }))
    )
  );

  updateSearchAfterAssetChanged$ = createEffect(() =>
    this._actions$.pipe(
      ofType(actions.updateAssetEditDetailResult),
      map(({ data }) => (RD.isSuccess(data) ? data.value : null)),
      filter(isNotNull),
      map((asset) =>
        appSharedStateActions.updateAssetInSearch({
          asset: {
            ...asset,
            studies: asset.studies.map((it) => ({
              assetId: asset.assetId,
              studyId: it.studyId,
              geomText: GeomFromGeomText.encode(it.geom),
            })),
          },
        })
      )
    )
  );

  createContact$ = createEffect(() =>
    this._actions$.pipe(
      ofType(actions.createContact),
      switchMap(({ contact }) => this._assetEditorService.createContact(contact)),
      map(appSharedStateActions.createContactResult)
    )
  );

  updateContact$ = createEffect(() =>
    this._actions$.pipe(
      ofType(actions.editContact),
      switchMap(({ contact }) => this._assetEditorService.updateContact(contact.id, contact)),
      map(appSharedStateActions.editContactResult)
    )
  );
}
