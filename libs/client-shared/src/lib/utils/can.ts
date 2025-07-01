import { inject } from '@angular/core';
import { Policy } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { map, Observable, of, shareReplay, switchMap } from 'rxjs';
import { Class } from 'type-fest';
import { selectUser } from '../state/app-shared-state.selectors';

export function can$<T, P extends Policy<T>>(policy: Class<P>, check: (policy: P) => boolean): Observable<boolean>;
export function can$<T, P extends Policy<T>, TR extends T>(
  policy: Class<P>,
  record: Observable<TR | null>,
  check: (policy: P, record: TR) => boolean,
): Observable<boolean>;
export function can$<T, P extends Policy<T>>(
  policy: Class<P>,
  checkOrRecord: unknown,
  checkOrNone?: (policy: P, record: T) => boolean,
): Observable<boolean> {
  const user$ = inject(Store).select(selectUser);
  if (checkOrNone === undefined) {
    const check = checkOrRecord as (policy: P) => boolean;
    return user$.pipe(
      map((user) => (user === null ? false : check(new policy(user)))),
      shareReplay(1),
    );
  } else {
    const check = checkOrNone;
    const record$ = checkOrRecord as Observable<T>;
    return user$.pipe(
      switchMap((user) => {
        if (user === null) {
          return of(false);
        }
        const instance = new policy(user);
        return record$.pipe(
          map((record) => (record === null ? false : check(instance, record))),
          shareReplay(1),
        );
      }),
    );
  }
}
