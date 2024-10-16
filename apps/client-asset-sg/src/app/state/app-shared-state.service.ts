import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiError, httpErrorResponseOrUnknownError } from '@asset-sg/client-shared';
import { decodeError, OE, ORD } from '@asset-sg/core';
import { ReferenceData } from '@asset-sg/shared';
import { SimpleWorkgroup } from '@asset-sg/shared/v2';
import * as RD from '@devexperts/remote-data-ts';
import * as E from 'fp-ts/Either';
import { flow } from 'fp-ts/function';
import { map, Observable, startWith } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppSharedStateService {
  private readonly httpClient = inject(HttpClient);

  public loadReferenceData(): ORD.ObservableRemoteData<ApiError, ReferenceData> {
    return this.httpClient
      .get('/api/reference-data')
      .pipe(
        map(flow(ReferenceData.decode, E.mapLeft(decodeError))),
        OE.catchErrorW(httpErrorResponseOrUnknownError),
        map(RD.fromEither),
        startWith(RD.pending)
      );
  }

  public loadWorkgroups(): Observable<SimpleWorkgroup[]> {
    return this.httpClient.get<SimpleWorkgroup[]>('/api/workgroups?simple');
  }
}
