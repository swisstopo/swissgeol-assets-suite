import { UrlMatchResult, UrlSegment } from '@angular/router';
import { pipe } from 'fp-ts/function';
import * as NEA from 'fp-ts/NonEmptyArray';
import * as O from 'fp-ts/Option';
import * as D from 'io-ts/Decoder';

const Tab = D.union(
  D.literal('general'),
  D.literal('usage'),
  D.literal('contacts'),
  D.literal('references'),
  D.literal('geometries'),
  D.literal('administration')
);
export function tabsMatcher(segments: UrlSegment[]): UrlMatchResult {
  return pipe(
    segments,
    NEA.fromArray,
    O.chain((ss) => {
      const tab = NEA.head(ss);
      return pipe(
        O.fromEither(Tab.decode(tab.path)),
        O.map(() => ({ tab }))
      );
    }),
    O.map((posParams) => ({
      consumed: segments,
      posParams,
    })),
    O.getOrElse(() => <UrlMatchResult>(null as unknown))
  );
}
