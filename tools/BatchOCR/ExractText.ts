/// <reference path="decs.d.ts" />

import * as TE from 'fp-ts/TaskEither';
import * as fs from 'fs/promises';
import { pipe, flow } from 'fp-ts/function';
import * as A from 'fp-ts/Array';
import * as S from 'fp-ts/string';
import * as E from 'fp-ts/Either';
import extract from 'pdf-text-extract';
import { spawn, exec } from 'node:child_process';
import { promisify } from 'util';
import path from 'node:path';

//sudo apt-get install poppler-utils

const srcDir = '/mnt/f/assetsNatRel4Cloud_ocr';

function unknownToError(e: unknown): Error {
    return typeof e === 'string' ? new Error(e) : e instanceof Error ? e : new Error('Unknown error');
}

const stat = (path: string) => TE.tryCatch(() => fs.stat(path), unknownToError);
const readdir = (path: string) => TE.tryCatch(() => fs.readdir(path), unknownToError);
const readFile = (filename: string) => TE.tryCatch(() => fs.readFile(filename), unknownToError);
const writeFile = (filename: string, data: Buffer) =>
    TE.tryCatch(() => fs.writeFile(filename, data, { encoding: 'utf8' }), unknownToError);

const extractP = promisify(extract) as (f: string, options: { splitPages: false }) => Promise<string>;
const spawnP = promisify(spawn);
const execP = promisify(exec);

const processFile = (filename: string) =>
    pipe(
        // TE.of(filename),
        TE.tryCatch(
            () => execP(`pdftotext ${path.join(srcDir, filename)} ${path.parse(filename).name + '.txt'}`),
            unknownToError,
        ),
        // TE.chain((a: string) => writeFile(path.parse(filename).name + '.txt', Buffer.from(a))),
    );

const program = pipe(
    readdir(srcDir),
    TE.map(A.filter(S.endsWith('.pdf'))),
    TE.chainW(
        flow(
            // A.filter(a => a === '38613.pdf'),
            A.map(processFile),
            A.sequence(TE.ApplicativeSeq),
        ),
    ),
);

program().then(a => {
    if (E.isLeft(a)) {
        console.log('call error', a);
    } else {
        console.log('call success', a.right);
    }
});
