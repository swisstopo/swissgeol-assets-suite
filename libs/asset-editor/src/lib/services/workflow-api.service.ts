import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AssetId, Workflow, WorkflowSchema } from '@asset-sg/shared/v2';
import { WorkflowSelection } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WorkflowApiService {
  private readonly httpClient = inject(HttpClient);

  public fetchWorkflow(id: AssetId): Observable<Workflow> {
    return this.httpClient
      .get<Workflow>(`/api/assets/${id}/workflow`)
      .pipe(map((data) => plainToInstance(WorkflowSchema, data)));
  }

  public updateReview(id: AssetId, selection: Partial<WorkflowSelection>): Observable<void> {
    return this.httpClient.patch<void>(`/api/assets/${id}/workflow/review`, selection);
  }

  public updateApproval(id: AssetId, selection: Partial<WorkflowSelection>): Observable<void> {
    return this.httpClient.patch<void>(`/api/assets/${id}/workflow/approval`, selection);
  }
}
