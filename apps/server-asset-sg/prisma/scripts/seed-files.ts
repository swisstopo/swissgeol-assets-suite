/* eslint-disable @nx/enforce-module-boundaries */
import { ListObjectsCommand, ListObjectsCommandOutput, S3Client } from '@aws-sdk/client-s3';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import { constant, pipe } from 'fp-ts/function';
import * as NEA from 'fp-ts/NonEmptyArray';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Record';
import * as TE from 'fp-ts/TaskEither';
import * as D from 'io-ts/Decoder';

import { DT, unknownToError } from '../../../../../../libs/core/src/';

const client = new S3Client({
    region: 'ch-dk-2',
    endpoint: 'https://sos-ch-dk-2.exo.io',
    credentials: {
        accessKeyId: 'EXOf4ecd6cfb29d68db408a76d1',
        secretAccessKey: 'YltURXDQy-T63FRcTHzi9Gsantdxgb21nh31qJzDMKE',
    },
});

const S3File = pipe(
    D.struct({
        Key: D.string,
        Size: D.number,
        LastModified: DT.date,
    }),
    D.map(({ Key, Size, LastModified }) => ({ name: Key, size: Size, lastModified: LastModified })),
);
interface S3File extends D.TypeOf<typeof S3File> {}

interface BucketParams {
    Bucket: string;
    Marker?: string;
}

function fetchPages(bucketParams: BucketParams): TE.TaskEither<Error, ListObjectsCommandOutput[]> {
    return pipe(
        TE.tryCatch(() => client.send(new ListObjectsCommand(bucketParams)), unknownToError),
        TE.chain(page =>
            page.IsTruncated
                ? pipe(
                      fetchPages({ ...bucketParams, Marker: page.Contents?.[page.Contents?.length - 1].Key }),
                      TE.map(pages => [page, ...pages]),
                  )
                : TE.right([page]),
        ),
    );
}

const regex = /^asset_files\/(?<sgsId>\d+)(?:-(?<sgsIdRange>\d+))?(?:_(?<index>\d+))?\.(?<extension>.+)$/;

const matchPdfFileToAssetId = (
    f: S3File,
): { noMatch: O.Option<S3File>; matches: { sgsId: number; s3File: S3File }[] } => {
    const match = f.name.match(regex);
    if (!match || !match.groups) {
        return {
            noMatch: O.some(f),
            matches: [],
        };
    } else {
        const sgsId = match.groups['sgsId'];
        const sgsIdRange = match.groups['sgsIdRange'];
        return {
            noMatch: O.none,
            matches: sgsIdRange
                ? pipe(
                      NEA.range(+sgsId, +sgsIdRange),
                      A.map(n => ({ sgsId: n, s3File: f })),
                  )
                : [{ sgsId: +sgsId, s3File: f }],
        };
    }
};

export const queryFiles = pipe(
    fetchPages({ Bucket: 'archive-swissgeol-datastore' }),
    TE.chainW(pages =>
        pipe(
            pages,
            A.map(page => page.Contents?.map(S3File.decode) || []),
            A.flatten,
            A.sequence(E.Applicative),
            E.map(files =>
                pipe(files, A.map(matchPdfFileToAssetId), a => ({
                    files,
                    noMatches: pipe(
                        a,
                        A.map(r => r.noMatch),
                        A.compact,
                    ),
                    matches: pipe(
                        a,
                        A.map(r => r.matches),
                        A.flatten,
                        NEA.fromArray,
                        O.map(NEA.groupBy(r => String(r.sgsId))),
                        O.getOrElseW(constant({})),
                        R.toArray,
                        A.map(([sgsId, a]) => ({
                            sgsId: +sgsId,
                            filenames: a.map(f => f.s3File.name.replace('asset_files/', '')),
                        })),
                    ),
                })),
            ),
            E.mapLeft(D.draw),
            TE.fromEither,
        ),
    ),
);

// queryFiles().then(data => {
//     if (E.isLeft(data)) console.log(data.left);
//     else console.log(data.right.files);
// });
