import { PrismaClient } from '@prisma/client';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';

const _importDynamic = new Function('modulePath', 'return import(modulePath)');

export const _fetch = async function (...args: unknown[]) {
    const { default: fetch } = await _importDynamic('node-fetch');
    return fetch(...args);
};

// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { unknownToError } from '../../../../../libs/core/src';

import { httpJson, printResult } from './http-utils';

const createUser = (email: string, password: string) =>
    httpJson(() => {
        console.log(JSON.stringify({ email, password, data: { lang: 'de' } }));

        return _fetch('http://localhost:4200/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password, data: { lang: 'de' } }),
        });
    });

const confirmAdminUser = (email: string) => {
    const prisma = new PrismaClient();
    return pipe(
        TE.tryCatch(
            () =>
                prisma.$executeRawUnsafe(
                    `update auth.users set email_confirmed_at = now(), role = 'service_role' where email = '${email}';`,
                ),
            unknownToError,
        ),
        TE.chain(() =>
            TE.tryCatch(
                () =>
                    prisma.$executeRawUnsafe(
                        `insert into asset_user select id, 'master-editor' as role from auth.users where email = '${email}';`,
                    ),
                unknownToError,
            ),
        ),
        // TE.filterOrElse(
        //     n => n === 1,
        //     unknownToError,
        //     // () => new Error(`No user found with email ${email}`),
        // ),
        TE.map(() => `User ${email} create and confirmed`),
    );
};

const email = 'wayne.maurer@lambda-it.ch';
const password = 'secret';

const program = pipe(
    createUser(email, password),
    TE.chain(() => confirmAdminUser(email)),
);

program().then(printResult);
