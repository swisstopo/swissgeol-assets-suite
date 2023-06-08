import * as path from 'node:path';

import { Injectable } from '@nestjs/common';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import { flow, pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as D from 'io-ts/Decoder';

import {
    DecodeError,
    TypedError,
    UnknownError,
    decodeError,
    isNil,
    unknownErrorTag,
    unknownToError,
    unknownToUnknownError,
} from '@asset-sg/core';
import { UserPatch, UserPost, UserRoleEnum, Users } from '@asset-sg/shared';

import { PrismaService } from '../prisma/prisma.service';
import { PrismaUsersDecoder, RawUserMetaData } from '../user/models';

const _importDynamic = new Function('modulePath', 'return import(modulePath)');
export const _fetch = async function (...args: unknown[]) {
    const { default: fetch } = await _importDynamic('node-fetch');
    return fetch(...args);
};

@Injectable()
export class AdminService {
    constructor(private readonly prismaService: PrismaService) {}

    getUsers(): TE.TaskEither<UnknownError | DecodeError, Users> {
        return pipe(
            TE.tryCatch(
                () =>
                    this.prismaService.assetUser.findMany({
                        select: { id: true, role: true, user: { select: { email: true, raw_user_meta_data: true } } },
                    }),
                unknownToUnknownError,
            ),
            TE.chainEitherKW(flow(PrismaUsersDecoder.decode, E.mapLeft(decodeError))),
        );
    }

    updateUser(id: string, user: UserPatch) {
        return TE.tryCatch(
            () =>
                this.prismaService.assetUser.update({
                    where: { id },
                    data: {
                        role: user.role,
                        user: {
                            update: {
                                raw_user_meta_data: RawUserMetaData.encode({ lang: user.lang }),
                            },
                        },
                    },
                }),
            unknownToUnknownError,
        );
    }

    createUser(accessToken: string, user: UserPost) {
        return pipe(
            pipe(
                TE.tryCatch(
                    () => this.prismaService.assetUser.findFirst({ where: { user: { email: user.email } } }),
                    unknownToUnknownError,
                ),
            ),
            TE.filterOrElseW(isNil, () => new TypedError('PermissionDeniedError', `User already exists`)),
            TE.chainW(() =>
                TE.tryCatch(() => {
                    const inviteUrl = new URL('/invite', process.env.AUTH_URL).href;
                    const redirect_to = new URL(
                        path.join(user.lang, `/a/set-password?ts=${Date.now()}`),
                        process.env.FRONTEND_URL,
                    ).href;
                    return _fetch(inviteUrl, {
                        method: 'POST',
                        headers: { Authorization: 'Bearer ' + accessToken, redirect_to },
                        body: JSON.stringify({ email: user.email, data: RawUserMetaData.encode({ lang: user.lang }) }),
                    });
                }, unknownToUnknownError),
            ),
            TE.filterOrElseW(
                res => res.status === 200,
                res =>
                    new TypedError(
                        'PermissionDeniedError',
                        `Failed to create user. status ${res.status}. statusText: ${res.statusText} `,
                    ),
            ),
            TE.chainW(res => TE.tryCatch(() => res.json(), unknownToUnknownError)),
            TE.chainEitherKW(flow(D.struct({ id: D.string }).decode, E.mapLeft(decodeError))),
            TE.chainW(({ id }) =>
                TE.tryCatch(
                    () =>
                        this.prismaService.assetUser.create({
                            data: {
                                id,
                                role: user.role,
                            },
                        }),
                    unknownToUnknownError,
                ),
            ),
            TE.chain(({ id }) =>
                user.role === UserRoleEnum.admin
                    ? TE.tryCatch(
                          () => this.prismaService.users.update({ where: { id }, data: { role: 'service_role' } }),
                          unknownToUnknownError,
                      )
                    : TE.right(null),
            ),
        );
    }

    deleteUser(accessToken: string, id: string) {
        const tasks: TE.TaskEither<TypedError<typeof unknownErrorTag, any>, any>[] = [
            TE.tryCatch(
                () => this.prismaService.assetUserFavourite.deleteMany({ where: { assetUserId: id } }),
                e => new TypedError(unknownErrorTag, unknownToError(e), 'Failed to delete user favourites'),
            ),
            TE.tryCatch(
                () => this.prismaService.assetUser.deleteMany({ where: { id } }),
                e => new TypedError(unknownErrorTag, unknownToError(e), 'Failed to delete user from asset_user table'),
            ),
            pipe(
                TE.tryCatch(
                    () =>
                        _fetch(new URL(`/admin/users/${id}`, process.env.AUTH_URL).href, {
                            method: 'DELETE',
                            headers: { Authorization: 'Bearer ' + accessToken },
                        }),
                    e => new TypedError(unknownErrorTag, unknownToError(e), 'Failed to delete user from endpoint'),
                    // unknownToUnknownError,
                ),
                TE.filterOrElseW(
                    r => r.status === 200,
                    r => new TypedError(unknownErrorTag, `Failed to delete user. status ${r.status}`),
                ),
            ),
        ];
        return pipe(tasks, A.sequence(TE.ApplicativeSeq));
    }
}
