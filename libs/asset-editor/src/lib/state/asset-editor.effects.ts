import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import * as RD from '@devexperts/remote-data-ts';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as D from 'io-ts/Decoder';
import { Observable, concat, concatMap, forkJoin, map, partition, share, switchMap, tap } from 'rxjs';

import { appSharedStateActions, filterNavigateToComponent } from '@asset-sg/client-shared';
import { DT, ORD, partitionEither } from '@asset-sg/core';

import { AssetEditorPageComponent } from '../components/asset-editor-page';
import { AssetEditorService } from '../services/asset-editor.service';

import * as actions from './asset-editor.actions';

@UntilDestroy()
@Injectable()
export class AssetEditorEffects {
    private _actions$ = inject(Actions);
    private _assetEditorService = inject(AssetEditorService);
    private _router = inject(Router);

    validatedQueryParams = partitionEither(
        filterNavigateToComponent(this._actions$, AssetEditorPageComponent).pipe(
            map(({ params }) =>
                pipe(D.struct({ assetId: D.union(DT.NumberFromString, D.literal('new')) }).decode(params)),
            ),
            share(),
        ),
    );

    navigateForInvalidQueryParams$ = createEffect(
        () =>
            this.validatedQueryParams[0].pipe(
                concatMap(e => {
                    console.error('error decoding queryParams', D.draw(e));
                    return this._router.navigate(['/'], { queryParams: undefined });
                }),
            ),
        { dispatch: false },
    );

    newOrAssetId = partition(this.validatedQueryParams[1], ({ assetId }) => assetId === 'new') as [
        Observable<{ assetId: 'new' }>,
        Observable<{ assetId: number }>,
    ];

    newAsset$ = createEffect(() =>
        this.newOrAssetId[0].pipe(map(() => actions.loadAssetEditDetailResult(RD.success(O.none)))),
    );

    loadAssetEditDetail$ = createEffect(() =>
        this.newOrAssetId[1].pipe(
            switchMap(params => this._assetEditorService.loadAssetDetailData(params.assetId)),
            tap(rd => {
                RD.isFailure(rd) && this._router.navigate(['/'], { queryParams: undefined });
            }),
            ORD.map(O.some),
            map(actions.loadAssetEditDetailResult),
        ),
    );

    createAsset$ = createEffect(() =>
        this._actions$.pipe(
            ofType(actions.createNewAsset),
            switchMap(({ patchAsset }) => this._assetEditorService.createAsset(patchAsset)),
            map(actions.updateAssetEditDetailResult),
        ),
    );

    updateAssetEditDetail$ = createEffect(() =>
        this._actions$.pipe(
            ofType(actions.updateAssetEditDetail),
            switchMap(({ assetId, patchAsset, newFiles, filesToDelete }) =>
                this._assetEditorService.deleteFiles(assetId, filesToDelete).pipe(
                    ORD.chainSwitchMapW(() => this._assetEditorService.uploadFiles(assetId, newFiles)),
                    ORD.chainSwitchMapW(() => this._assetEditorService.updateAssetDetail(assetId, patchAsset)),
                ),
            ),
            map(actions.updateAssetEditDetailResult),
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
