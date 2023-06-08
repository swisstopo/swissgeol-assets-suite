import { getEq as getEqArray } from 'fp-ts/Array';
import { Eq } from 'fp-ts/Eq';
import { constTrue, pipe } from 'fp-ts/function';
import { Eq as eqNumber } from 'fp-ts/number';
import * as RA from 'fp-ts/ReadonlyArray';
import { Eq as eqString } from 'fp-ts/string';

import { toBoolean } from './option';

export const eqTrue: Eq<unknown> = {
    equals: constTrue,
};

export const eqStringArray = getEqArray(eqString);

export const eqStringNumber = getEqArray(eqNumber);

export function getEqArrayUnordered<A>(E: Eq<A>): Eq<ReadonlyArray<A>> {
    return {
        equals: (xs, ys) =>
            xs === ys ||
            (xs.length === ys.length &&
                xs.every(
                    (x, i) =>
                        E.equals(x, ys[i]) ||
                        pipe(
                            ys,
                            RA.findFirst(y => E.equals(x, y)),
                            toBoolean,
                        ),
                )),
    };
}
