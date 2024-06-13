import { UrlMatchResult, UrlSegment } from '@angular/router';
import { Lang } from '@asset-sg/shared';
import { pipe } from 'fp-ts/function';
import * as NEA from 'fp-ts/NonEmptyArray';
import * as O from 'fp-ts/Option';
import * as D from 'io-ts/Decoder';

const validSegments = D.union(D.literal('assets'), D.literal('favourites'));

export function assetsPageMatcher(segments: UrlSegment[]): UrlMatchResult {
  return pipe(
    segments,
    NEA.fromArray,
    O.chain((ss) => {
      const lang = NEA.head(ss);
      return pipe(
        O.fromEither(Lang.decode(lang.path)),
        O.map(() =>
          pipe(
            ss,
            NEA.tail,
            NEA.fromArray,
            O.map(NEA.head),
            O.chainFirstEitherK((a) => validSegments.decode(a.path)),
            O.map((path) => ({ lang, path })),
            O.getOrElse(() => ({ lang }))
          )
        )
      );
    }),
    O.map((posParams) => ({
      consumed: segments,
      posParams,
    })),
    O.getOrElse(() => <UrlMatchResult>(null as unknown))
  );
}
