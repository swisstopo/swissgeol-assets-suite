import { PrismaClient } from '@prisma/client';
import * as A from 'fp-ts/Array';
import { pipe } from 'fp-ts/function';
import { Eq as EqNumber } from 'fp-ts/number';
import * as TE from 'fp-ts/TaskEither';

import { GetRightTypeOfTaskEither, unknownToError } from '@asset-sg/core';
import { LV95 } from '@asset-sg/shared';

import { makeSearchAssetResult, searchAssetQuery } from './search-asset';

import { postgresStudiesByPolygon } from '@/utils/postgres-studies/postgres-studies';


const executeAssetQuery = (prismaClient: PrismaClient, assetIds: number[]) =>
    TE.tryCatch(
        () =>
            prismaClient.asset.findMany({
                select: searchAssetQuery.select,
                where: { assetId: { in: assetIds } },
            }),
        unknownToError,
    );

export interface AssetQueryResults extends GetRightTypeOfTaskEither<ReturnType<typeof executeAssetQuery>> {}
export type AssetQueryResult = AssetQueryResults[number];

export function findAssetsByPolygon(prismaClient: PrismaClient, polygon: LV95[]) {
    return pipe(
        postgresStudiesByPolygon(prismaClient, polygon),
        TE.bindTo('studies'),
        TE.bind('assets', ({ studies }) =>
            executeAssetQuery(
                prismaClient,
                pipe(
                    studies,
                    A.map(s => s.assetId),
                    A.uniq(EqNumber),
                ),
            ),
        ),
        TE.map(({ assets, studies }) => makeSearchAssetResult(assets, studies)),
    );
}
