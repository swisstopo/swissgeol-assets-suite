import * as E from 'fp-ts/Either';
import { flow, pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as D from 'io-ts/Decoder';

import { DT, unknownToError } from '@asset-sg/core';
import { AssetByTitle } from '@asset-sg/shared';

import { createElasticSearchClient } from './elastic-search-client';

const decoder = pipe(
    D.struct({
        hits: D.struct({
            hits: D.array(
                D.struct({
                    _score: D.number,
                    fields: D.struct({
                        assetId: DT.HeadOfNonEmptyArray(D.number),
                        titlePublic: DT.HeadOfNonEmptyArray(D.string),
                    }),
                }),
            ),
        }),
    }),
    D.map(a =>
        a.hits.hits.map(b => ({ score: b._score, titlePublic: b.fields.titlePublic, assetId: b.fields.assetId })),
    ),
);

export const searchAssetsByTitle = (searchString: string): TE.TaskEither<Error, AssetByTitle[]> => {
    const client = createElasticSearchClient();

    return pipe(
        TE.tryCatch(
            () =>
                client.search({
                    index: 'swissgeol_asset_asset',
                    size: 10000,
                    query: {
                        bool: {
                            must: {
                                query_string: {
                                    query: searchString,
                                    fields: ['titlePublic'],
                                },
                            },
                        },
                    },
                    fields: ['assetId', 'titlePublic'],
                    _source: false,
                }),
            unknownToError,
        ),
        TE.chainEitherKW(
            flow(
                decoder.decode,
                E.mapLeft(e => new Error(D.draw(e))),
            ),
        ),
    );
};
