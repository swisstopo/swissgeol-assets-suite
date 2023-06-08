import { PrismaClient } from '@prisma/client';
import * as A from 'fp-ts/Array';
import { flow, pipe } from 'fp-ts/function';
import * as NEA from 'fp-ts/NonEmptyArray';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';

import { unknownToUnknownError } from '@asset-sg/core';

import { postgresStudiesByAssetIds } from '../postgres-studies/postgres-studies';
import { makeSearchAssetResult, searchAssetQuery } from '../search/search-asset';

const getAssetsfromPrisma = (prisma: PrismaClient, assetUserId: string) =>
    pipe(
        TE.tryCatch(
            () =>
                prisma.assetUserFavourite.findMany({
                    where: { assetUserId },
                    select: { Asset: { select: searchAssetQuery.select } },
                }),
            unknownToUnknownError,
        ),
        TE.map(flow(A.map(a => a.Asset))),
    );

export const getFavourites = (prisma: PrismaClient, assetUserId: string) =>
    pipe(
        getAssetsfromPrisma(prisma, assetUserId),
        TE.bindTo('assets'),
        TE.bindW('studies', ({ assets }) =>
            pipe(
                assets,
                NEA.fromArray,
                O.map(aa =>
                    postgresStudiesByAssetIds(
                        prisma,
                        aa.map(a => a.assetId),
                    ),
                ),
                O.getOrElseW(() => TE.right([])),
            ),
        ),
        TE.map(({ assets, studies }) => makeSearchAssetResult(assets, studies)),
    );
