import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  Asset,
  AssetFile,
  AssetFileSchema,
  AssetId,
  AssetSchema,
  Contact,
  ContactData,
  ContactId,
  CreateAssetData,
  CreateAssetDataSchema,
  CreateAssetFileData,
  SimpleUserSchema,
  UpdateAssetData,
  UpdateAssetDataSchema,
  Workflow,
  WorkflowChangeData,
  WorkflowSchema,
  WorkgroupId,
} from '@asset-sg/shared/v2';
import { SimpleUser } from '@swissgeol/ui-core';
import { plainToInstance } from 'class-transformer';
import { forkJoin, map, Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AssetEditorService {
  private readonly httpClient = inject(HttpClient);

  public createAsset(data: CreateAssetData): Observable<Asset> {
    return this.httpClient
      .post(`/api/assets`, plainToInstance(CreateAssetDataSchema, data))
      .pipe(map((res) => plainToInstance(AssetSchema, res)));
  }

  public updateAsset(id: AssetId, data: UpdateAssetData): Observable<Asset> {
    return this.httpClient
      .put(`/api/assets/${id}`, plainToInstance(UpdateAssetDataSchema, data))
      .pipe(map((res) => plainToInstance(AssetSchema, res)));
  }

  public deleteAsset(assetId: AssetId): Observable<void> {
    return this.httpClient.delete<void>(`/api/assets/${assetId}`);
  }

  public uploadFilesForAsset(id: AssetId, files: CreateAssetFileData[]): Observable<AssetFile[]> {
    if (files.length === 0) {
      return of([]);
    }
    return forkJoin(
      files.map((file) => {
        const formData = new FormData();
        formData.append('file', file.file);
        if (file.legalDocCode != null) {
          formData.append('legalDocCode', file.legalDocCode);
        }
        return this.httpClient
          .post<AssetFile>(`/api/assets/${id}/files`, formData)
          .pipe(map((data) => plainToInstance(AssetFileSchema, data)));
      }),
    );
  }

  public updateContact(contactId: ContactId, patchContact: ContactData): Observable<Contact> {
    return this.httpClient.put<Contact>(`/api/contacts/${contactId}`, patchContact);
  }

  public createContact(patchContact: ContactData): Observable<Contact> {
    return this.httpClient.post<Contact>(`/api/contacts`, patchContact);
  }

  public getUsersForWorkgroup(workgroupId: WorkgroupId): Observable<SimpleUser[]> {
    return this.httpClient.get<object[]>(`/api/workgroups/${workgroupId}/users`).pipe(
      map((it) => plainToInstance(SimpleUserSchema, it)),
      map((it) => it.sort((a, b) => a.firstName.localeCompare(b.firstName))),
    );
  }

  public publishAsset(id: AssetId): Observable<Workflow> {
    return this.httpClient
      .post<Workflow>(`/api/assets/${id}/workflow/publish`, null)
      .pipe(map((data) => plainToInstance(WorkflowSchema, data)));
  }

  public createWorkflowChange(assetId: AssetId, data: WorkflowChangeData): Observable<Workflow> {
    return this.httpClient
      .post<Workflow>(`/api/assets/${assetId}/workflow/change`, data)
      .pipe(map((data) => plainToInstance(WorkflowSchema, data)));
  }
}
