import { Injectable } from '@nestjs/common';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import { flow, pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';

import {
    DecodeError,
    TypedError,
    UnknownError,
    decodeError,
    unknownErrorTag,
    unknownToError,
    unknownToUnknownError,
} from '@asset-sg/core';
import { UserPatch, Users } from '@asset-sg/shared';

import { PrismaService } from '../prisma/prisma.service';
import { PrismaUsersDecoder } from '../user/models';

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
                        select: { id: true, role: true, email: true, lang: true },
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
                      lang: user.lang,
                    },
                }),
            unknownToUnknownError,
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
