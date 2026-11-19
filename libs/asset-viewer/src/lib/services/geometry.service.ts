import { HttpClient, HttpDownloadProgressEvent, HttpEvent, HttpEventType } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { LV95 } from '@asset-sg/shared';
import {
  GeometryAccessType,
  GeometryId,
  GeometryType,
  MapGeometry,
  SearchType,
  WorkflowStatus,
} from '@asset-sg/shared/v2';
import { concatMap, filter, from, map, Observable, scan, toArray } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GeometryService {
  private readonly _httpClient = inject(HttpClient);

  fetchAll(type: SearchType): Observable<MapGeometry[]> {
    return this._httpClient
      .post('/api/geometries', { type }, { observe: 'events', responseType: 'text', reportProgress: true })
      .pipe(
        filter((event) => event.type === HttpEventType.DownloadProgress || event.type === HttpEventType.Response),
        map((event: HttpEvent<string>) => (event as HttpDownloadProgressEvent).partialText ?? ''),
        bufferUntilLineEnd(),
        filter((line) => line.length !== 0),
        map(parseGeometryLine),
        toArray(),
      );
  }
}

export const parseGeometryLine = (line: string): MapGeometry => {
  const [id, assetId, geometryType, accessType, x, y, workflowStatus, hasRequestedChanges] = line.split(';');
  return {
    id: `${id}` as GeometryId,
    assetId: parseInt(assetId),
    type: geometryType as GeometryType,
    center: { x: parseFloat(x), y: parseFloat(y) } as LV95,
    accessType: parseInt(accessType) as GeometryAccessType,
    workflowStatus: workflowStatus as WorkflowStatus,
    hasRequestedChanges: hasRequestedChanges?.trim() === '1',
  };
};

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
        { buffer: '', previous: '', lines: [] as string[] },
      ),
      filter((acc) => acc.lines.length > 0),
      concatMap((acc) => from(acc.lines)),
    );
}
