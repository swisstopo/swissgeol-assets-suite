import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ReferenceDataMapping, ReferenceDataSchema, SimpleWorkgroup } from '@asset-sg/shared/v2';
import { plainToInstance } from 'class-transformer';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppSharedStateService {
  private readonly httpClient = inject(HttpClient);

  public fetchReferenceData(): Observable<ReferenceDataMapping> {
    return this.httpClient.get('/api/reference-data').pipe(
      map((input) => {
        const data = plainToInstance(ReferenceDataSchema, input);
        return {
          nationalInterestTypes: makeMapping(data.nationalInterestTypes, (it) => it.code),
          assetTopics: makeMapping(data.assetTopics, (it) => it.code),
          assetFormats: makeMapping(data.assetFormats, (it) => it.code),
          assetKinds: makeMapping(data.assetKinds, (it) => it.code),
          contactKinds: makeMapping(data.contactKinds, (it) => it.code),
          languages: makeMapping(data.languages, (it) => it.code),
          legalDocs: makeMapping(data.legalDocs, (it) => it.code),
          contacts: makeMapping(data.contacts, (it) => it.id),
        } satisfies ReferenceDataMapping;
      }),
    );
  }

  public loadWorkgroups(): Observable<SimpleWorkgroup[]> {
    return this.httpClient.get<SimpleWorkgroup[]>('/api/workgroups?simple');
  }
}
const makeMapping = <T, K>(values: T[], getKey: (value: T) => K): Map<K, T> => {
  const mapping = new Map<K, T>();
  for (const value of values) {
    const key = getKey(value);
    if (mapping.has(key)) {
      throw new Error(`Key is mapped multiple times: '${key}'`);
    }
    mapping.set(key, value);
  }
  return mapping;
};
