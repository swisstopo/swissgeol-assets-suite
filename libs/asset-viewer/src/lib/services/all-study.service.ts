import { HttpClient, HttpDownloadProgressEvent, HttpEvent, HttpEventType } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiError } from '@asset-sg/client-shared';
import { ORD } from '@asset-sg/core';
import { LV95 } from '@asset-sg/shared';
import * as RD from '@devexperts/remote-data-ts';
import * as E from 'fp-ts/Either';
import { concatMap, filter, from, map, Observable, scan, share, toArray } from 'rxjs';

import { AllStudyDTO, AllStudyDTOs } from '../models';

@Injectable({ providedIn: 'root' })
export class AllStudyService {
  constructor(private _httpClient: HttpClient) {}

  getAllStudies(): ORD.ObservableRemoteData<ApiError, AllStudyDTOs> {
    return this.getAllStudiesFromApi();
  }

  private getAllStudiesFromApi(): ORD.ObservableRemoteData<ApiError, AllStudyDTO[]> {
    return this._httpClient.get('/api/studies', { observe: 'events', responseType: 'text', reportProgress: true }).pipe(
      filter((event) => event.type === HttpEventType.DownloadProgress || event.type === HttpEventType.Response),
      map((event: HttpEvent<string>) => (event as HttpDownloadProgressEvent).partialText ?? ''),
      bufferUntilLineEnd(),
      filter((line) => line.length !== 0),
      map((line) => {
        const [id, assetId, isPoint, x, y] = line.split(';');
        return {
          studyId: `study_${id}`,
          assetId: parseInt(assetId),
          isPoint: Boolean(isPoint),
          centroid: { x: parseInt(x), y: parseInt(y) } as LV95,
        } as AllStudyDTO;
      }),
      toArray(),
      map((it) => E.right<ApiError, AllStudyDTO[]>(it)),
      map(RD.fromEither),
      share()
    );
  }
}

function bufferUntilLineEnd() {
  return (source: Observable<string>) =>
    source.pipe(
      scan(
        (acc, chunk) => {
          acc.buffer += chunk.substring(acc.previous.length);
          const lines = acc.buffer.split('\n');
          acc.buffer = lines.pop() ?? ''; // Keep the last partial line in the buffer
          acc.lines = lines;
          acc.previous = chunk;
          return acc;
        },
        { buffer: '', previous: '', lines: [] as string[] }
      ),
      filter((acc) => acc.lines.length > 0),
      concatMap((acc) => from(acc.lines))
    );
}
