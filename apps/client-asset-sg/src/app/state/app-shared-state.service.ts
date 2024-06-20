import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiError, httpErrorResponseOrUnknownError } from '@asset-sg/client-shared';
import { OE, ORD, decodeError } from '@asset-sg/core';
import { ReferenceData } from '@asset-sg/shared';
import * as RD from '@devexperts/remote-data-ts';
import * as E from 'fp-ts/Either';
import { flow } from 'fp-ts/function';
import { map, startWith } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppSharedStateService {
  constructor(private _httpClient: HttpClient) {}

  public loadReferenceData(): ORD.ObservableRemoteData<ApiError, ReferenceData> {
    return this._httpClient
      .get('/api/reference-data')
      .pipe(
        map(flow(ReferenceData.decode, E.mapLeft(decodeError))),
        OE.catchErrorW(httpErrorResponseOrUnknownError),
        map(RD.fromEither),
        startWith(RD.pending)
      );
  }
}
