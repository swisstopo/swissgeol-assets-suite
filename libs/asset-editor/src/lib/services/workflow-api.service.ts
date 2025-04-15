import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Workflow } from '@asset-sg/shared/v2';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WorkflowApiService {
  private readonly httpClient = inject(HttpClient);

  public fetchWorkflow(assetId: number): Observable<Workflow> {
    return this.httpClient.get<Workflow>(`/api/assets/${assetId}/workflow`);
  }
}
