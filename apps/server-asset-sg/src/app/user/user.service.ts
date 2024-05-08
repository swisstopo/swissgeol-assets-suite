import { Injectable } from '@nestjs/common';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';

import { DecodeError, UnknownError, decode, unknownToUnknownError } from '@asset-sg/core';
import { SearchAssetResult, User } from '@asset-sg/shared';

import { AdminService } from '../admin/admin.service';
import { PrismaService } from '../prisma/prisma.service';

import { getFavourites } from './get-favourites';
import { PrismaUserDecoder } from './models';

@Injectable()
export class UserService {
    constructor(private readonly prismaService: PrismaService, private readonly adminServie: AdminService) {}

    getUser(assetUserId: string, email?: string): TE.TaskEither<UnknownError | DecodeError | Error, User> {
        return pipe(
            TE.tryCatch(
                () =>
                    this.prismaService.assetUser.findFirst({
                        select: { id: true, role: true, email: true, lang: true },
                        where: { id: assetUserId },
                    }),
                unknownToUnknownError,
            ),
            TE.chain(userOrNull => {
                return userOrNull
                    ? TE.right(userOrNull)
                    : pipe(
                          this.createDefaultUser(assetUserId, email ?? ''),
                          TE.map(newUser => {
                              return newUser;
                          }),
                      );
            }),
            TE.chainEitherKW(decode(PrismaUserDecoder)),
        );
    }

    createDefaultUser(assetUserId: string, email: string): TE.TaskEither<DecodeError | Error, User> {
        return pipe(
            TE.tryCatch(
                () =>
                    this.prismaService.assetUser.create({
                        data: {
                            id: assetUserId,
                            oidcId: assetUserId,
                            email: email ?? 'example@email.com',
                            role: 'viewer',
                            lang: 'de',
                        },
                        select: {
                            id: true,
                            email: true,
                            role: true,
                            lang: true,
                        },
                    }),
                (error: unknown) =>
                    new Error('Failed to create user: ' + (error instanceof Error ? error.message : String(error))),
            ),
            TE.chainEitherKW(decode(PrismaUserDecoder)),
        );
    }

    getFavourites(assetUserId: string): TE.TaskEither<Error, SearchAssetResult> {
        return getFavourites(this.prismaService, assetUserId);
    }

    addFavourite(assetUserId: string, assetId: number) {
        return TE.tryCatch(
            () =>
                this.prismaService.assetUserFavourite.create({
                    data: { assetId, assetUserId, created_at: new Date() },
                }),
            unknownToUnknownError,
        );
    }

    removeFavourite(assetUserId: string, assetId: number) {
        return TE.tryCatch(
            () =>
                this.prismaService.assetUserFavourite.delete({
                    where: { assetUserId_assetId: { assetId, assetUserId } },
                }),
            unknownToUnknownError,
        );
    }
}
