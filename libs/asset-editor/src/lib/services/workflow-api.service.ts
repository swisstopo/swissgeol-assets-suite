import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Workflow, WorkflowSchema } from '@asset-sg/shared/v2';
import { plainToInstance } from 'class-transformer';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WorkflowApiService {
  private readonly httpClient = inject(HttpClient);

  public fetchWorkflow(assetId: number): Observable<Workflow> {
    return this.httpClient
      .get<Workflow>(`/api/assets/${assetId}/workflow`)
      .pipe(map((data) => plainToInstance(WorkflowSchema, data)));
  }
}
