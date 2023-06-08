import { Injectable } from '@nestjs/common';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';

import { DecodeError, UnknownError, decode, unknownToUnknownError } from '@asset-sg/core';
import { SearchAssetResult, User } from '@asset-sg/shared';

import { PrismaService } from '../prisma/prisma.service';

import { getFavourites } from './get-favourites';
import { PrismaUserDecoder } from './models';

@Injectable()
export class UserService {
    constructor(private readonly prismaService: PrismaService) {}

    getUser(assetUserId: string): TE.TaskEither<UnknownError | DecodeError, User> {
        return pipe(
            TE.tryCatch(
                () =>
                    this.prismaService.assetUser.findUnique({
                        select: { id: true, role: true, user: { select: { email: true, raw_user_meta_data: true } } },
                        where: { id: assetUserId },
                    }),
                unknownToUnknownError,
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
