import * as RD from '@devexperts/remote-data-ts';
import { Eq } from 'fp-ts/Eq';

import { eqTrue } from './eq';

export const rdEqOnlyRight = <A>(eq: Eq<A>) => RD.getEq(eqTrue, eq);

export const rdIsComplete = <E, A>(rd: RD.RemoteData<E, A>): rd is RD.RemoteSuccess<A> | RD.RemoteFailure<E> =>
    RD.isSuccess(rd) || RD.isFailure(rd);

export const rdIsNotComplete = <E, A>(rd: RD.RemoteData<E, A>): rd is RD.RemoteInitial | RD.RemotePending =>
    RD.isInitial(rd) || RD.isPending(rd);

export type GetFailureTypeOfRemoteData<T extends RD.RemoteData<unknown, unknown>> = Extract<
    T,
    RD.RemoteFailure<unknown>
>['error'];

export type GetSuccessTypeOfRemoteData<T extends RD.RemoteData<unknown, unknown>> = Extract<
    T,
    RD.RemoteSuccess<unknown>
>['value'];

type Values<T> = T[keyof T];

type GetRemoteData<Obj> = Values<{
    [Prop in keyof Obj]: Obj[Prop] extends RD.RemoteData<unknown, unknown> ? Prop : never;
}>;

export const rdSequenceProps = <E, A, Key extends GetRemoteData<A>>(
    a: A,
    ...keys: Key[]
): RD.RemoteData<E, { [K in keyof A]: K extends Key ? (A[K] extends RD.RemoteData<E, infer B> ? B : A[K]) : A[K] }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out = {} as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let notSuccess: RD.RemoteData<E, any> | undefined;
    for (const key in a) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (keys.includes(key as any)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const value = a[key] as any;
            if (RD.isSuccess(value)) {
                out[key] = value.value;
            } else {
                notSuccess = value;
                break;
            }
        } else {
            out[key] = a[key];
        }
    }
    return !notSuccess ? RD.success(out) : notSuccess;
};
