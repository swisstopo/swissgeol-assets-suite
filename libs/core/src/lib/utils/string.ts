import { Ord, fromCompare } from 'fp-ts/Ord';
import { Ord as ordString } from 'fp-ts/string';

export const isNonEmptyString = (x: string | null | undefined): x is string => typeof x === 'string' && x.length > 0;

export const ordStringLowerCase: Ord<string> = fromCompare((a, b) =>
  ordString.compare(a.toLowerCase(), b.toLowerCase()),
);
