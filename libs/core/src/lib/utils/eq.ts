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
              RA.findFirst((y) => E.equals(x, y)),
              toBoolean
            )
        )),
  };
}

/**
 *  Deep equality check for objects from https://medium.com/@stheodorejohn/javascript-object-deep-equality-comparison-in-javascript-7aa227e889d4.
 * @param obj1
 * @param obj2
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  // Base case: If both objects are identical, return true.
  if (obj1 === obj2) {
    return true;
  }
  // Check if both objects are objects and not null.
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
    return false;
  }
  // Get the keys of both objects.
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  // Check if the number of keys is the same.
  if (keys1.length !== keys2.length) {
    return false;
  }
  // Iterate through the keys and compare their values recursively.
  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }
  // If all checks pass, the objects are deep equal.
  return true;
}

export function arrayEqual<T>(a: T[] | null | undefined, b: T[] | null | undefined) {
  return !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);
}
