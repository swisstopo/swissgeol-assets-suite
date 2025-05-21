import { unknownError, unknownToError, unknownToUnknownError } from '@asset-sg/core';
import { LV95 } from '@asset-sg/shared';
import { Prisma, PrismaClient } from '@prisma/client';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import { flow, pipe } from 'fp-ts/function';
import * as NEA from 'fp-ts/NonEmptyArray';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Record';
import * as TE from 'fp-ts/TaskEither';
import * as C from 'io-ts/Codec';
import * as D from 'io-ts/Decoder';

export const PostgresAllStudies = C.array(
  C.struct({
    assetId: C.number,
    studyId: C.string,
    geomText: C.string,
  }),
);
export type PostgresAllStudies = D.TypeOf<typeof PostgresAllStudies>;

const decodeStudyQueryResult = flow(
  PostgresAllStudies.decode,
  E.mapLeft((e) => new Error(D.draw(e))),
  TE.fromEither,
);

const createAllStudyQuery = (whereClause: string) => `
        select
            asset_id as "assetId",
            study_id as "studyId",
            geom_text as "geomText"
        from
            public.all_study
        where
            ${whereClause}
`;

const allStudyQuery = (prismaClient: PrismaClient, whereClause: string): TE.TaskEither<Error, PostgresAllStudies> =>
  pipe(
    TE.tryCatch(() => prismaClient.$queryRawUnsafe(createAllStudyQuery(whereClause)), unknownToError),
    TE.chain(decodeStudyQueryResult),
  );

export const postgresStudiesByPolygon = (prismaClient: PrismaClient, polygon: LV95[]) => {
  const polygonParam = polygon.map((point) => `${point.y} ${point.x}`).join(',');
  return allStudyQuery(
    prismaClient,
    `st_contains(st_geomfromtext('polygon((${polygonParam}))', 2056), st_centroid(geom))`,
  );
};

export const postgresStudiesByAssetId = (prismaClient: PrismaClient, assetId: number) =>
  allStudyQuery(prismaClient, `asset_id=${assetId}`);

export const postgresStudiesByAssetIds = (
  prismaClient: PrismaClient,
  assetIds: Array<number>,
): TE.TaskEither<Error, PostgresAllStudies> =>
  pipe(
    TE.tryCatch(
      () => prismaClient.$queryRaw`
            select
                asset_id as "assetId",
                study_id as "studyId",
                geom_text as "geomText"
            from
                public.all_study
            where
                asset_id in (${Prisma.join(assetIds)})
            `,
      unknownToError,
    ),
    TE.chain(decodeStudyQueryResult),
  );

const parseStudyId = (studyId: string) => {
  const match = /^study_(area|location|trace)_(\d+)$/.exec(studyId);
  return match === null
    ? E.left(new Error(`Invalid studyId: ${studyId}`))
    : E.right({ type: match[1], studyId: parseInt(match[2]) });
};

export const updateStudies = (prismaClient: PrismaClient, studies: { studyId: string; geomText: string }[]) =>
  pipe(
    studies,
    A.map((study) =>
      pipe(
        TE.fromEither(parseStudyId(study.studyId)),
        TE.mapLeft(unknownToUnknownError),
        TE.chain(({ type, studyId }) =>
          TE.tryCatch(
            () =>
              prismaClient.$executeRawUnsafe(
                `update public.study_${type} set
                                     geom = st_geomfromtext('${study.geomText}', 2056)
                                 where
                                     study_${type}_id = ${studyId}
                                 and st_equals(geom, st_geomfromtext('${study.geomText}', 2056)) = false`,
              ),
            unknownToUnknownError,
          ),
        ),
      ),
    ),
    A.sequence(TE.ApplicativeSeq),
  );

export const createStudies = (prismaClient: PrismaClient, assetId: number, studyGeomTexts: string[]) =>
  pipe(
    studyGeomTexts,
    A.map((geomText) =>
      pipe(
        (() => {
          if (geomText.startsWith('POLYGON')) return 'area';
          if (geomText.startsWith('POINT')) return 'location';
          if (geomText.startsWith('LINESTRING')) return 'trace';
          return null;
        })(),
        E.fromNullable(unknownError(new Error(`Invalid geomText: ${geomText}`))),
        E.map((type) => ({ type, geomText })),
      ),
    ),
    A.sequence(E.Applicative),
    TE.fromEither,
    TE.chainW(
      flow(
        A.map(({ type, geomText }) =>
          TE.tryCatch(
            () =>
              prismaClient.$executeRawUnsafe(
                `insert into public.study_${type} (asset_id, geom_quality_item_code, geom)
                                 values (${assetId}, 'unkown', st_geomfromtext('${geomText}', 2056))`,
              ),
            unknownToUnknownError,
          ),
        ),
        A.sequence(TE.ApplicativeSeq),
      ),
    ),
  );

export const deleteStudies = (prismaClient: PrismaClient, assetId: number, studyIdsToKeep: string[]) =>
  pipe(
    studyIdsToKeep,
    A.map(parseStudyId),
    A.sequence(E.Applicative),
    TE.fromEither,
    TE.mapLeft(unknownToUnknownError),
    TE.chainW(
      flow(
        NEA.fromArray,
        O.map(NEA.groupBy((a) => a.type)),
        O.map((a) => ({
          area: [],
          location: [],
          trace: [],
          ...pipe(
            a,
            R.map((a) => a.map((b) => b.studyId)),
          ),
        })),
        O.alt(() => O.some({ area: [], location: [], trace: [] })),
        O.map(
          flow(
            R.mapWithIndex((type, studyIdsToKeep) =>
              TE.tryCatch(
                () =>
                  studyIdsToKeep.length === 0
                    ? prismaClient.$executeRawUnsafe(`delete from public.study_${type} where asset_id = ${assetId}`)
                    : prismaClient.$executeRawUnsafe(
                        `delete from public.study_${type}
                                           where
                                               asset_id = ${assetId}
                                           and study_${type}_id not in (${studyIdsToKeep.join(',')})`,
                      ),
                unknownToUnknownError,
              ),
            ),
            R.sequence(TE.ApplicativeSeq),
          ),
        ),
        O.getOrElseW(() => TE.right(undefined)),
      ),
    ),
  );
