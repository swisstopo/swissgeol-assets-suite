import { HttpClient, HttpDownloadProgressEvent, HttpEvent, HttpEventType } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { LV95 } from '@asset-sg/shared';
import { StudyAccessType, StudyGeometryType } from '@asset-sg/shared/v2';
import { concatMap, filter, from, map, Observable, scan, toArray } from 'rxjs';

import { AllStudyDTO } from '../models';

@Injectable({ providedIn: 'root' })
export class AllStudyService {
  private readonly _httpClient = inject(HttpClient);

  getAllStudies(): Observable<AllStudyDTO[]> {
    return this.getAllStudiesFromApi();
  }

  private getAllStudiesFromApi(): Observable<AllStudyDTO[]> {
    return this._httpClient.get('/api/studies', { observe: 'events', responseType: 'text', reportProgress: true }).pipe(
      filter((event) => event.type === HttpEventType.DownloadProgress || event.type === HttpEventType.Response),
      map((event: HttpEvent<string>) => (event as HttpDownloadProgressEvent).partialText ?? ''),
      bufferUntilLineEnd(),
      filter((line) => line.length !== 0),
      map((line) => {
        const [id, assetId, geometryType, accessType, x, y] = line.split(';');
        return {
          studyId: `study_${id}`,
          assetId: parseInt(assetId),
          geometryType: geometryType as StudyGeometryType,
          centroid: { x: parseFloat(x), y: parseFloat(y) } as LV95,
          accessType: parseInt(accessType) as StudyAccessType,
        };
      }),
      toArray()
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
