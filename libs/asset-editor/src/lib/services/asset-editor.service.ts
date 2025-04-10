import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiError, httpErrorResponseError } from '@asset-sg/client-shared';
import { decodeError, OE, ORD, unknownError } from '@asset-sg/core';
import { Contact, PatchAsset, PatchContact } from '@asset-sg/shared';
import * as RD from '@devexperts/remote-data-ts';
import * as E from 'fp-ts/Either';
import { flow } from 'fp-ts/function';
import { concat, forkJoin, map, Observable, of, startWith, toArray } from 'rxjs';

import { AssetEditorNewFile } from '../components/asset-editor-form-group';
import { AssetEditDetail } from '../models';

@Injectable({ providedIn: 'root' })
export class AssetEditorService {
  private readonly httpClient = inject(HttpClient);

  public loadAsset(assetId: number): Observable<AssetEditDetail> {
    return this.httpClient
      .get(`/api/asset-edit/${assetId}`)
      .pipe(map((res) => (AssetEditDetail.decode(res) as E.Right<AssetEditDetail>).right));
  }

  public createAsset(patchAsset: PatchAsset): Observable<AssetEditDetail> {
    return this.httpClient
      .post(`/api/asset-edit`, PatchAsset.encode(patchAsset))
      .pipe(map((res) => (AssetEditDetail.decode(res) as E.Right<AssetEditDetail>).right));
  }

  public updateAssetDetail(assetId: number, patchAsset: PatchAsset): Observable<AssetEditDetail> {
    return this.httpClient
      .put(`/api/asset-edit/${assetId}`, PatchAsset.encode(patchAsset))
      .pipe(map((res) => (AssetEditDetail.decode(res) as E.Right<AssetEditDetail>).right));
  }

  public deleteAsset(assetId: number): Observable<void> {
    return this.httpClient.delete<void>(`/api/asset-edit/${assetId}`);
  }

  public deleteFiles(assetId: number, fileIds: number[]): ORD.ObservableRemoteData<ApiError, unknown> {
    return fileIds.length
      ? forkJoin(
          fileIds.map((fileId) => {
            return this.httpClient
              .delete(`/api/assets/${assetId}/files/${fileId}`)
              .pipe(map(E.right), OE.catchErrorW(httpErrorResponseError), map(RD.fromEither), startWith(RD.pending));
          })
        ).pipe(
          map((rds) => {
            const error = rds.find(RD.isFailure);
            if (error) return error;
            if (!rds.every(RD.isSuccess))
              return RD.failure(unknownError(new Error('uploadFiles stream completed without success or failure')));
            return RD.success(undefined);
          })
        )
      : of(RD.success(undefined));
  }

  public uploadFiles(assetId: number, files: AssetEditorNewFile[]): ORD.ObservableRemoteData<ApiError, unknown> {
    return files.length
      ? concat(
          ...files.map((file) => {
            const formData = new FormData();
            formData.append('file', file.file);
            formData.append('type', file.type);
            if (file.legalDocItemCode != null) {
              formData.append('legalDocItemCode', file.legalDocItemCode);
            }
            return this.httpClient
              .post(`/api/assets/${assetId}/files`, formData)
              .pipe(map(E.right), OE.catchErrorW(httpErrorResponseError));
          })
        ).pipe(
          toArray(),
          map((rds) => {
            const error = rds.find(E.isLeft);
            if (error) return RD.failure(error.left);
            return !rds.every(E.isRight)
              ? RD.failure(unknownError(new Error('uploadFiles stream completed without success or failure')))
              : RD.success(undefined);
          }),
          startWith(RD.pending)
        )
      : of(RD.success(undefined));
  }

  public updateContact(contactId: number, patchContact: PatchContact): ORD.ObservableRemoteData<ApiError, Contact> {
    return this.httpClient
      .put(`/api/contacts/${contactId}`, PatchContact.encode(patchContact))
      .pipe(
        map(flow(Contact.decode, E.mapLeft(decodeError))),
        OE.catchErrorW(httpErrorResponseError),
        map(RD.fromEither),
        startWith(RD.pending)
      );
  }

  public createContact(patchContact: PatchContact): ORD.ObservableRemoteData<ApiError, Contact> {
    return this.httpClient
      .post(`/api/contacts`, PatchContact.encode(patchContact))
      .pipe(
        map(flow(Contact.decode, E.mapLeft(decodeError))),
        OE.catchErrorW(httpErrorResponseError),
        map(RD.fromEither),
        startWith(RD.pending)
      );
  }
}
