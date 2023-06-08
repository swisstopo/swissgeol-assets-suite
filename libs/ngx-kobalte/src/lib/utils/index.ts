import { Observable, startWith } from 'rxjs';
import { Accessor, from } from 'solid-js';

export const fromWithStartWith = <T>(o$: Observable<T>, startValue: T) =>
    from(o$.pipe(startWith(startValue))) as Accessor<T>;
