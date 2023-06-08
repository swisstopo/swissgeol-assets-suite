import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import * as fs from 'fs/promises';
import { exec } from 'node:child_process';
import path from 'node:path';
import { pipe } from 'fp-ts/function';
import * as A from 'fp-ts/Array';
import * as S from 'fp-ts/string';
import * as N from 'fp-ts/number';
import { contramap } from 'fp-ts/Ord';
import { promisify } from 'util';
import * as C from 'io-ts/Codec';

const execP = promisify(exec);

const srcDir = '/home/wayne/Ubuntu_20.04_general_Projects/lambda-it/asset-swissgeol-ch/images/bulk-ocr/volumes/pdfs';
const progressFile = '/tmp/batch-ocr-progress.json';

const dockerRun = (filename: string) =>
    `docker run --rm -v ${srcDir}:/mnt/pdfs registry.lambda-it.ch/lambda/asset-swissgeol/batch-ocr python /app/run_ocr_pipeline.py program /mnt/pdfs/${filename}`;

// docker run --rm -v /home/wayne/Ubuntu_20.04_general_Projects/lambda-it/asset-swissgeol-ch/tools/BatchOCR/pdfs:/mnt/pdfs registry.lambda-it.ch/lambda/asset-swissgeol/batch-ocr python /app/run_ocr_pipeline.py program /mnt/pdfs/23639.pdf

function unknownToError(e: unknown): Error {
    return typeof e === 'string' ? new Error(e) : e instanceof Error ? e : new Error('Unknown error');
}

const stat = (path: string) => TE.tryCatch(() => fs.stat(path), unknownToError);
const readdir = (path: string) => TE.tryCatch(() => fs.readdir(path), unknownToError);
const readFile = (filename: string) => TE.tryCatch(() => fs.readFile(filename, 'utf8'), unknownToError);
const writeFile = (filename: string, s: string) => TE.tryCatch(() => fs.writeFile(filename, s, 'utf8'), unknownToError);

const processFile = (filename: string) => pipe(TE.tryCatch(() => execP(dockerRun(filename)), unknownToError));

const OrdBySize = pipe(
    N.Ord,
    contramap((a: { size: number }) => a.size),
);

const orderByFileSize = (files: string[]) =>
    pipe(
        files,
        A.map(filename =>
            pipe(
                stat(path.join(srcDir, filename)),
                TE.map(({ size }) => ({ filename, size: size })),
            ),
        ),
        A.sequence(TE.ApplicativeSeq),
        TE.map(A.sort(OrdBySize)),
    );

const SuccessfullyProcessed = C.struct({
    _tag: C.literal('SuccessfullyProcessed'),
    filename: C.string,
    startTs: C.number,
    endTs: C.number,
    startSize: C.number,
    endSize: C.number,
    duration: C.string,
    result: C.UnknownRecord,
});
const Failed = C.struct({
    _tag: C.literal('Failed'),
    reason: C.string,
});

const Result = C.sum('_tag')({
    SuccessfullyProcessed,
    Failed,
});
type Result = C.TypeOf<typeof Result>;

const ProgressFileContents = C.record(Result);

const readProgress = pipe(
    readFile(progressFile),
    TE.alt(() => TE.right('{}')),
    TE.chain(s => TE.fromEither(E.tryCatch(() => JSON.parse(s), unknownToError))),
    TE.chainW(a => TE.fromEither(ProgressFileContents.decode(a))),
);

const writeProgress = (filename: string, result: Result) =>
    pipe(
        readProgress,
        TE.map(a => ({ ...a, [filename]: result })),
        TE.chainW(a => writeFile(progressFile, JSON.stringify(a, null, 2))),
    );

const processFileAndWriteProgress = (f: { filename: string; size: number }) => {
    return pipe(
        TE.of({ filename: f.filename, startSize: f.size }),
        TE.chain(a =>
            pipe(
                TE.of({ startTs: Date.now() }),
                TE.bind('result', () => processFile(a.filename)),
                TE.map(b => {
                    const endTs = new Date().getTime();
                    return {
                        ...a,
                        ...b,
                        _tag: 'SuccessfullyProcessed' as const,
                        endTs,
                        duration: (endTs - b.startTs) / 1000 + 's',
                    };
                }),
                TE.bind('endSize', () =>
                    pipe(
                        stat(path.join(srcDir, f.filename)),
                        TE.map(({ size }) => size),
                    ),
                ),
            ),
        ),
        TE.orElseW(e =>
            TE.right({
                _tag: 'Failed' as const,
                reason: JSON.stringify(e, null, 2),
            }),
        ),
        TE.map(Result.encode),
        TE.chain(result => writeProgress(f.filename, result)),
    );
};

const program = pipe(
    readdir(srcDir),
    TE.map(A.filter(S.endsWith('.pdf'))),
    TE.chain(orderByFileSize),
    TE.bindTo('srcFiles'),
    TE.bind('progress', () => readProgress),
    TE.map(({ srcFiles, progress }) =>
        srcFiles.filter(f => !progress[f.filename] || progress[f.filename]._tag === 'Failed'),
    ),
    TE.map(files => files.map(processFileAndWriteProgress)),
    TE.chainW(A.sequence(TE.ApplicativeSeq)),
);

program().then(a => {
    if (E.isLeft(a)) {
        console.log(JSON.stringify(a.left, null, 2));
    } else {
        console.log(a.right);
    }
});
