import { Injectable } from '@nestjs/common';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as C from 'io-ts/Codec';

import { isNotNull, unknownToUnknownError } from '@asset-sg/core';
import { BaseAssetEditDetail, PatchAsset, User } from '@asset-sg/shared';

import { AssetEditRepo } from './asset-edit.repo';

import { PrismaService } from '@/core/prisma.service';
import { AssetSearchService } from '@/features/assets/search/asset-search.service';
import { notFoundError } from '@/utils/errors';
import { deleteFile } from '@/utils/file/delete-file';
import { putFile } from '@/utils/file/put-file';


export const AssetEditDetail = C.struct({
    ...BaseAssetEditDetail,
    studies: C.array(C.struct({ assetId: C.number, studyId: C.string, geomText: C.string })),
});
export type AssetEditDetail = C.TypeOf<typeof AssetEditDetail>;

@Injectable()
export class AssetEditService {
    constructor(
        private readonly assetRepo: AssetEditRepo,
        private readonly prismaService: PrismaService,
        private readonly assetSearchService: AssetSearchService,
    ) {}

    public createAsset(user: User, patch: PatchAsset) {
        return pipe(
            TE.tryCatch(
                () => this.assetRepo.create({ user, patch }),
                unknownToUnknownError,
            ),
            TE.chain(({ assetId }) => TE.tryCatch(() => this.assetRepo.find(assetId), unknownToUnknownError)),
            TE.chainW(TE.fromPredicate(isNotNull, notFoundError)),
            TE.tap((asset) => (
                TE.tryCatch(() => this.assetSearchService.register(asset), unknownToUnknownError)
            )),
            TE.map((asset) => AssetEditDetail.encode(asset)),
        );
    }

    public updateAsset(user: User, assetId: number, patch: PatchAsset) {
        return pipe(
            TE.tryCatch(() => this.assetRepo.update(assetId, { user, patch }), unknownToUnknownError),
            TE.chainW(TE.fromPredicate(isNotNull, notFoundError)),
            TE.tap((asset) => (
                TE.tryCatch(() => this.assetSearchService.register(asset), unknownToUnknownError)
            )),
            TE.map((asset) => AssetEditDetail.encode(asset)),
        );
    }

    public uploadFile(
        user: User,
        assetId: number,
        file: { name: string; buffer: Buffer; size: number; mimetype: string },
    ) {
        const originalFileName = Buffer.from(file.name, 'latin1').toString('utf8');
        const fileName = originalFileName.startsWith('a' + assetId + '_')
            ? originalFileName
            : 'a' + assetId + '_' + originalFileName;

        const lastDotIndex = fileName.lastIndexOf('.');
        const fileExtension = lastDotIndex === -1 ? '' : fileName.substring(lastDotIndex + 1);
        const fileNameWithoutExtension = lastDotIndex === -1 ? fileName : fileName.substring(0, lastDotIndex);
        const match = fileNameWithoutExtension.match(/_([0-9]{14})$/);
        const fileNameWithoutTs = match ? fileNameWithoutExtension.substring(0, match.index) : fileNameWithoutExtension;
        const filenameToSearchFor = fileNameWithoutTs + '.' + fileExtension;

        return pipe(
            TE.tryCatch(
                () =>
                    this.prismaService.file.findFirst({
                        where: {
                            fileName: {
                                contains: filenameToSearchFor,
                            },
                        },
                    }),
                unknownToUnknownError,
            ),
            TE.map(file => {
                const d = new Date();
                return file
                    ? fileNameWithoutTs +
                    '_' +
                    d.getFullYear() +
                    (d.getMonth() + 1).toString().padStart(2, '0') +
                    d.getDate().toString().padStart(2, '0') +
                    d.getHours().toString().padStart(2, '0') +
                    d.getMinutes().toString().padStart(2, '0') +
                    d.getSeconds().toString().padStart(2, '0') +
                    '.' +
                    fileExtension
                    : fileName;
            }),
            TE.bindTo('_fileName'),
            TE.bind('updateResult', ({ _fileName }) =>
                TE.tryCatch(() => {
                    return this.prismaService.asset.update({
                        where: { assetId },
                        data: {
                            assetFiles: {
                                create: {
                                    file: {
                                        create: {
                                            fileName: _fileName,
                                            fileSize: file.size,
                                            ocrStatus:
                                                file.mimetype == 'application/pdf' ? 'waiting' : 'willNotBeProcessed',
                                            lastModified: new Date(),
                                        },
                                    },
                                },
                            },
                            lastProcessedDate: new Date(),
                            processor: user.email,
                        },
                    });
                }, unknownToUnknownError),
            ),
            TE.chain(({ _fileName }) => putFile(_fileName, file.buffer, file.mimetype)),
        );
    }

    public deleteFile(user: User, assetId: number, fileId: number) {
        return pipe(
            TE.tryCatch(
                () => this.prismaService.file.findFirstOrThrow({ where: { fileId }, select: { fileName: true } }),
                unknownToUnknownError,
            ),
            TE.chain(f => deleteFile(f.fileName)),
            TE.chain(() =>
                TE.tryCatch(
                    () => this.prismaService.assetFile.delete({ where: { assetId_fileId: { assetId, fileId } } }),
                    unknownToUnknownError,
                ),
            ),
            TE.chain(() =>
                TE.tryCatch(() => this.prismaService.file.delete({ where: { fileId } }), unknownToUnknownError),
            ),
            TE.chain(() =>
                TE.tryCatch(
                    () =>
                        this.prismaService.asset.update({
                            where: { assetId },
                            data: { lastProcessedDate: new Date(), processor: user.email },
                        }),
                    unknownToUnknownError,
                ),
            ),
        );
    }
}
