import { DT } from '@asset-sg/core';
import { DateId, UsageCode } from '@asset-sg/shared';
import { ADTType, makeADT, ofType } from '@morphic-ts/adt';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';

const SearchResultsElasticData = pipe(
  D.struct({
    hits: D.struct({
      hits: D.array(
        D.struct({
          _score: D.number,
          fields: D.struct({ assetId: DT.HeadOfNonEmptyArray(D.number) }),
        })
      ),
    }),
    aggregations: D.struct({
      minCreateDate: pipe(
        D.struct({ value: DateId }),
        D.map((x) => x.value)
      ),
      maxCreateDate: pipe(
        D.struct({ value: DateId }),
        D.map((x) => x.value)
      ),
      authorIds: D.struct({
        buckets: D.array(D.struct({ key: D.number, doc_count: D.number })),
      }),
      assetKindItemCodes: D.struct({
        buckets: D.array(D.struct({ key: D.string, doc_count: D.number })),
      }),
      languageItemCodes: D.struct({
        buckets: D.array(D.struct({ key: D.string, doc_count: D.number })),
      }),
      usageCodes: D.struct({
        buckets: D.array(D.struct({ key: UsageCode, doc_count: D.number })),
      }),
      manCatLabelItemCodes: D.struct({
        buckets: D.array(D.struct({ key: D.string, doc_count: D.number })),
      }),
    }),
  })
);
export type SearchResultsElasticData = D.TypeOf<typeof SearchResultsElasticData>;

type SearchAssetElasticResultEmpty = { _tag: 'SearchAssetElasticResultEmpty' };
type SearchAssetElasticResultNonEmpty = SearchResultsElasticData & { _tag: 'SearchAssetElasticResultNonEmpty' };

export const SearchAssetElasticResult = makeADT('_tag')({
  SearchAssetElasticResultEmpty: ofType<SearchAssetElasticResultEmpty>(),
  SearchAssetElasticResultNonEmpty: ofType<SearchAssetElasticResultNonEmpty>(),
});
export type SearchAssetElasticResult = ADTType<typeof SearchAssetElasticResult>;

const decode = (a: unknown) =>
  pipe(
    D.struct({ hits: D.struct({ hits: D.UnknownArray }) }).decode(a),
    E.chain((r) =>
      r.hits.hits.length === 0
        ? E.right(SearchAssetElasticResult.of.SearchAssetElasticResultEmpty({}))
        : pipe(SearchResultsElasticData.decode(a), E.map(SearchAssetElasticResult.of.SearchAssetElasticResultNonEmpty))
    )
  );

export const SearchAssetElasticResultDecoder: D.Decoder<unknown, SearchAssetElasticResult> = { decode };
