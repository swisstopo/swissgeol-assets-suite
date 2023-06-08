import { Observable, delay, of, switchMap } from 'rxjs';

export type GetTypeOfObservable<T> = T extends Observable<infer U> ? U : T;

export const delayObservable = <T>(ms: number, source: Observable<T>) =>
    of({}).pipe(
        delay(ms),
        switchMap(() => source),
    );
