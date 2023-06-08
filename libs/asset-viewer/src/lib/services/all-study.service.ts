import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as RD from '@devexperts/remote-data-ts';
import * as E from 'fp-ts/Either';
import { flow } from 'fp-ts/function';
import { map, startWith } from 'rxjs';

import { ApiError, httpErrorResponseError } from '@asset-sg/client-shared';
import { OE, ORD, decodeError, unknownToUnknownError } from '@asset-sg/core';
import { AllStudyDTOsFromAPI } from '@asset-sg/shared';

import { AllStudyDTOs } from '../models';

@Injectable({ providedIn: 'root' })
export class AllStudyService {
    constructor(private _httpClient: HttpClient) {}

    getAllStudies(): ORD.ObservableRemoteData<ApiError, AllStudyDTOs> {
        return this.getAllStudiesFromApi();
    }

    private getAllStudiesFromApi(): ORD.ObservableRemoteData<ApiError, AllStudyDTOs> {
        return this._httpClient.get('/api/all-study').pipe(
            map(flow(AllStudyDTOsFromAPI.decode, E.mapLeft(decodeError))),
            OE.catchErrorW((err: HttpErrorResponse | unknown) =>
                err instanceof HttpErrorResponse ? httpErrorResponseError(err) : unknownToUnknownError(err),
            ),
            map(RD.fromEither),
            startWith(RD.pending),
        );
    }
}
