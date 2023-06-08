import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import * as RD from '@devexperts/remote-data-ts';
import * as E from 'fp-ts/Either';
import { flow, pipe } from 'fp-ts/function';
import { EMPTY, concat, concatAll, forkJoin, map, merge, of, startWith, switchMap, toArray } from 'rxjs';

import { ApiError, httpErrorResponseError } from '@asset-sg/client-shared';
import { OE, ORD, decodeError, unknownError } from '@asset-sg/core';
import { Contact, PatchAsset, PatchContact } from '@asset-sg/shared';

import { AssetEditDetail } from '../models';

@Injectable({ providedIn: 'root' })
export class AssetEditorService {
    private _httpClient = inject(HttpClient);

    public loadAssetDetailData(assetId: number): ORD.ObservableRemoteData<ApiError, AssetEditDetail> {
        return this._httpClient
            .get(`/api/asset-edit/${assetId}`)
            .pipe(
                map(flow(AssetEditDetail.decode, E.mapLeft(decodeError))),
                OE.catchErrorW(httpErrorResponseError),
                map(RD.fromEither),
                startWith(RD.pending),
            );
    }

    public createAsset(patchAsset: PatchAsset): ORD.ObservableRemoteData<ApiError, AssetEditDetail> {
        return this._httpClient
            .put(`/api/asset-edit`, PatchAsset.encode(patchAsset))
            .pipe(
                map(flow(AssetEditDetail.decode, E.mapLeft(decodeError))),
                OE.catchErrorW(httpErrorResponseError),
                map(RD.fromEither),
                startWith(RD.pending),
            );
    }

    public updateAssetDetail(
        assetId: number,
        patchAsset: PatchAsset,
    ): ORD.ObservableRemoteData<ApiError, AssetEditDetail> {
        return this._httpClient
            .patch(`/api/asset-edit/${assetId}`, PatchAsset.encode(patchAsset))
            .pipe(
                map(flow(AssetEditDetail.decode, E.mapLeft(decodeError))),
                OE.catchErrorW(httpErrorResponseError),
                map(RD.fromEither),
                startWith(RD.pending),
            );
    }

    public deleteFiles(assetId: number, fileIds: number[]): ORD.ObservableRemoteData<ApiError, unknown> {
        return fileIds.length
            ? forkJoin(
                  fileIds.map(fileId => {
                      return this._httpClient
                          .delete(`/api/asset-edit/${assetId}/file/${fileId}`)
                          .pipe(
                              map(E.right),
                              OE.catchErrorW(httpErrorResponseError),
                              map(RD.fromEither),
                              startWith(RD.pending),
                          );
                  }),
              ).pipe(
                  map(rds => {
                      const error = rds.find(RD.isFailure);
                      if (error) return error;
                      if (!rds.every(RD.isSuccess))
                          return RD.failure(
                              unknownError(new Error('uploadFiles stream completed without success or failure')),
                          );
                      return RD.success(undefined);
                  }),
              )
            : of(RD.success(undefined));
    }

    public uploadFiles(assetId: number, files: File[]): ORD.ObservableRemoteData<ApiError, unknown> {
        return files.length
            ? concat(
                  ...files.map(file => {
                      const formData = new FormData();
                      formData.append('file', file);
                      return this._httpClient
                          .post(`/api/asset-edit/${assetId}/file`, formData)
                          .pipe(map(E.right), OE.catchErrorW(httpErrorResponseError));
                  }),
              ).pipe(
                  toArray(),
                  map(rds => {
                      const error = rds.find(E.isLeft);
                      if (error) return RD.failure(error.left);
                      return !rds.every(E.isRight)
                          ? RD.failure(
                                unknownError(new Error('uploadFiles stream completed without success or failure')),
                            )
                          : RD.success(undefined);
                  }),
                  startWith(RD.pending),
              )
            : of(RD.success(undefined));
    }

    public updateContact(contactId: number, patchContact: PatchContact): ORD.ObservableRemoteData<ApiError, Contact> {
        return this._httpClient
            .patch(`/api/contact-edit/${contactId}`, PatchContact.encode(patchContact))
            .pipe(
                map(flow(Contact.decode, E.mapLeft(decodeError))),
                OE.catchErrorW(httpErrorResponseError),
                map(RD.fromEither),
                startWith(RD.pending),
            );
    }

    public createContact(patchContact: PatchContact): ORD.ObservableRemoteData<ApiError, Contact> {
        return this._httpClient
            .put(`/api/contact-edit`, PatchContact.encode(patchContact))
            .pipe(
                map(flow(Contact.decode, E.mapLeft(decodeError))),
                OE.catchErrorW(httpErrorResponseError),
                map(RD.fromEither),
                startWith(RD.pending),
            );
    }
}
