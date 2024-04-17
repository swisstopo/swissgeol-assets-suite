import { basename } from 'node:path';

import { Injectable } from '@nestjs/common';
import { Contact } from '@prisma/client';
import * as A from 'fp-ts/Array';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import * as C from 'io-ts/Codec';

import { decodeError, isNotNil, sequenceProps, unknownToUnknownError } from '@asset-sg/core';
import {
    BaseAssetEditDetail,
    DateIdFromDate,
    ElasticSearchAsset,
    PatchAsset,
    User,
    dateFromDateId,
} from '@asset-sg/shared';

import { notFoundError } from '../errors';
import { deleteFile } from '../file/delete-file';
import { putFile } from '../file/put-file';
import { AssetEditDetailFromPostgres } from '../models/asset-edit-detail';
import {
    createStudies,
    deleteStudies,
    postgresStudiesByAssetId,
    updateStudies,
} from '../postgres-studies/postgres-studies';
import { PrismaService } from '../prisma/prisma.service';
import { createElasticSearchClient } from '../search/elastic-search-client';
import { searchAssetsByTitle } from '../search/find-assets-by-title';

export const AssetEditDetail = C.struct({
    ...BaseAssetEditDetail,
    studies: C.array(C.struct({ assetId: C.number, studyId: C.string, geomText: C.string })),
});
export type AssetEditDetail = C.TypeOf<typeof AssetEditDetail>;

@Injectable()
export class AssetEditService {
    constructor(private readonly prismaService: PrismaService) {}

    private _getAsset(assetId: number) {
        return pipe(
            TE.tryCatch(
                () =>
                    this.prismaService.asset.findUnique({
                        where: { assetId },
                        select: {
                            assetId: true,
                            titlePublic: true,
                            titleOriginal: true,
                            createDate: true,
                            receiptDate: true,
                            lastProcessedDate: true,
                            processor: true,
                            assetKindItemCode: true,
                            assetFormatItemCode: true,
                            languageItemCode: true,
                            internalUse: true,
                            publicUse: true,
                            isNatRel: true,
                            sgsId: true,
                            geolDataInfo: true,
                            geolContactDataInfo: true,
                            geolAuxDataInfo: true,
                            municipality: true,
                            ids: true,
                            assetContacts: { select: { role: true, contactId: true } },
                            manCatLabelRefs: { select: { manCatLabelItemCode: true } },
                            assetFormatCompositions: { select: { assetFormatItemCode: true } },
                            typeNatRels: { select: { natRelItemCode: true } },
                            assetMain: { select: { assetId: true, titlePublic: true } },
                            subordinateAssets: { select: { assetId: true, titlePublic: true } },
                            siblingXAssets: { select: { assetY: { select: { assetId: true, titlePublic: true } } } },
                            siblingYAssets: { select: { assetX: { select: { assetId: true, titlePublic: true } } } },
                            statusWorks: { select: { statusWorkItemCode: true, statusWorkDate: true } },
                            assetFiles: { select: { file: true } },
                        },
                    }),
                unknownToUnknownError,
            ),
            TE.chainW(TE.fromPredicate(isNotNil, notFoundError)),
            TE.chainW(a =>
                pipe(
                    postgresStudiesByAssetId(this.prismaService, a.assetId),
                    TE.mapLeft(unknownToUnknownError),
                    TE.map(studies => ({ ...a, studies })),
                ),
            ),
            TE.chainW(a => pipe(TE.fromEither(AssetEditDetailFromPostgres.decode(a)), TE.mapLeft(decodeError))),
        );
    }
    public getAsset(assetId: number) {
        return pipe(this._getAsset(assetId), TE.map(AssetEditDetail.encode));
    }

    public searchForAssetByTitle(title: string) {
        return pipe(searchAssetsByTitle(title));
    }

    public createAsset(user: User, patchAsset: PatchAsset) {
        return pipe(
            TE.tryCatch(
                () =>
                    this.prismaService.asset.create({
                        data: {
                            titlePublic: patchAsset.titlePublic,
                            titleOriginal: patchAsset.titleOriginal,
                            createDate: DateIdFromDate.encode(patchAsset.createDate),
                            receiptDate: DateIdFromDate.encode(patchAsset.receiptDate),
                            assetKindItem: { connect: { assetKindItemCode: patchAsset.assetKindItemCode } },
                            assetFormatItem: { connect: { assetFormatItemCode: patchAsset.assetFormatItemCode } },
                            languageItem: { connect: { languageItemCode: patchAsset.languageItemCode } },
                            isExtract: false,
                            isNatRel: patchAsset.isNatRel,
                            lastProcessedDate: new Date(),
                            processor: user.email,
                            manCatLabelRefs: {
                                createMany: {
                                    data: patchAsset.manCatLabelRefs.map(manCatLabelItemCode => ({
                                        manCatLabelItemCode,
                                    })),
                                    skipDuplicates: true,
                                },
                            },
                            assetContacts: {
                                createMany: { data: patchAsset.assetContacts, skipDuplicates: true },
                            },
                            ids: {
                                createMany: {
                                    data: pipe(patchAsset.ids.map(({ id, description }) => ({ id, description }))),
                                },
                            },
                            typeNatRels: {
                                createMany: {
                                    data: patchAsset.typeNatRels.map(natRelItemCode => ({ natRelItemCode })),
                                    skipDuplicates: true,
                                },
                            },
                            internalUse: {
                                create: {
                                    isAvailable: patchAsset.internalUse.isAvailable,
                                    statusAssetUseItemCode: patchAsset.internalUse.statusAssetUseItemCode,
                                    startAvailabilityDate: pipe(
                                        patchAsset.internalUse.startAvailabilityDate,
                                        O.map(dateFromDateId),
                                        O.toNullable,
                                    ),
                                },
                            },
                            publicUse: {
                                create: {
                                    isAvailable: patchAsset.publicUse.isAvailable,
                                    statusAssetUseItemCode: patchAsset.publicUse.statusAssetUseItemCode,
                                    startAvailabilityDate: pipe(
                                        patchAsset.publicUse.startAvailabilityDate,
                                        O.map(dateFromDateId),
                                        O.toNullable,
                                    ),
                                },
                            },
                            statusWorks: {
                                create: {
                                    statusWorkDate: new Date(),
                                    statusWorkItemCode: 'initiateAsset',
                                },
                            },
                        },
                    }),
                unknownToUnknownError,
            ),
            TE.chain(({ assetId }) => this._getAsset(assetId)),
            TE.bindTo('asset'),
            TE.bindW('contacts', () => TE.tryCatch(() => this.prismaService.contact.findMany(), unknownToUnknownError)),
            TE.bindW('elasticSearchResult', ({ asset, contacts }) =>
                TE.tryCatch(
                    () =>
                        createElasticSearchClient().bulk({
                            refresh: true,
                            operations: [
                                { index: { _index: 'swissgeol_asset_asset', _id: asset.assetId } },
                                createElasticSearchAsset(asset, contacts),
                            ],
                        }),
                    unknownToUnknownError,
                ),
            ),
            TE.map(({ asset }) => AssetEditDetail.encode(asset)),
        );
    }

    public updateAsset(user: User, assetId: number, patchAsset: PatchAsset) {
        return pipe(
            TE.tryCatch(
                () =>
                    this.prismaService.assetXAssetY.deleteMany({
                        where: { OR: [{ assetXId: assetId }, { assetYId: assetId }] },
                    }),
                unknownToUnknownError,
            ),
            TE.chain(() =>
                TE.tryCatch(
                    () =>
                        this.prismaService.assetXAssetY.createMany({
                            data: patchAsset.siblingAssetIds.map(assetYId => ({ assetXId: assetId, assetYId })),
                            skipDuplicates: true,
                        }),
                    unknownToUnknownError,
                ),
            ),
            TE.chain(() =>
                TE.tryCatch(
                    () =>
                        this.prismaService.asset.update({
                            where: { assetId },
                            data: {
                                titlePublic: patchAsset.titlePublic,
                                titleOriginal: patchAsset.titleOriginal,
                                createDate: DateIdFromDate.encode(patchAsset.createDate),
                                receiptDate: DateIdFromDate.encode(patchAsset.receiptDate),
                                assetKindItemCode: patchAsset.assetKindItemCode,
                                assetFormatItemCode: patchAsset.assetFormatItemCode,
                                languageItemCode: patchAsset.languageItemCode,
                                isNatRel: patchAsset.isNatRel,
                                assetMainId: O.toUndefined(patchAsset.assetMainId),
                                lastProcessedDate: new Date(),
                                processor: user.email,
                                manCatLabelRefs: {
                                    deleteMany: {},
                                    createMany: {
                                        data: patchAsset.manCatLabelRefs.map(manCatLabelItemCode => ({
                                            manCatLabelItemCode,
                                        })),
                                        skipDuplicates: true,
                                    },
                                },
                                assetContacts: {
                                    deleteMany: {},
                                    createMany: { data: patchAsset.assetContacts, skipDuplicates: true },
                                },
                                ids: {
                                    deleteMany: {
                                        NOT: pipe(
                                            patchAsset.ids,
                                            A.map(id => id.idId),
                                            A.compact,
                                            A.map(idId => ({ idId })),
                                        ),
                                    },
                                    upsert: [
                                        ...pipe(
                                            patchAsset.ids,
                                            A.map(id => sequenceProps(id, 'idId')),
                                            A.compact,
                                            A.map(id => ({ where: { idId: id.idId }, create: id, update: id })),
                                        ),
                                        ...pipe(
                                            patchAsset.ids,
                                            A.filter(id => O.isNone(id.idId)),
                                            A.map(id => ({
                                                where: { idId: -1 },
                                                create: { id: id.id, description: id.description },
                                                update: {},
                                            })),
                                        ),
                                    ],
                                },
                                typeNatRels: {
                                    deleteMany: {},
                                    createMany: {
                                        data: patchAsset.typeNatRels.map(natRelItemCode => ({ natRelItemCode })),
                                        skipDuplicates: true,
                                    },
                                },
                            },
                        }),
                    unknownToUnknownError,
                ),
            ),
            TE.chain(() =>
                TE.tryCatch(
                    () =>
                        this.prismaService.asset.update({
                            where: { assetId },
                            data: {
                                internalUse: {
                                    update: {
                                        isAvailable: patchAsset.internalUse.isAvailable,
                                        statusAssetUseItemCode: patchAsset.internalUse.statusAssetUseItemCode,
                                        startAvailabilityDate: pipe(
                                            patchAsset.internalUse.startAvailabilityDate,
                                            O.map(dateFromDateId),
                                            O.toNullable,
                                        ),
                                    },
                                },
                                publicUse: {
                                    update: {
                                        isAvailable: patchAsset.publicUse.isAvailable,
                                        statusAssetUseItemCode: patchAsset.publicUse.statusAssetUseItemCode,
                                        startAvailabilityDate: pipe(
                                            patchAsset.publicUse.startAvailabilityDate,
                                            O.map(dateFromDateId),
                                            O.toNullable,
                                        ),
                                    },
                                },
                            },
                        }),
                    unknownToUnknownError,
                ),
            ),
            TE.chainW(() =>
                pipe(
                    patchAsset.newStatusWorkItemCode,
                    O.map(workstatusItemCode =>
                        TE.tryCatch(
                            () =>
                                this.prismaService.asset.update({
                                    where: { assetId },
                                    data: {
                                        statusWorks: {
                                            create: {
                                                statusWorkDate: new Date(),
                                                statusWorkItemCode: workstatusItemCode,
                                            },
                                        },
                                    },
                                }),
                            unknownToUnknownError,
                        ),
                    ),
                    O.getOrElseW(() => TE.right(undefined)),
                ),
            ),
            TE.chain(() =>
                TE.tryCatch(
                    () =>
                        this.prismaService.assetXAssetY.createMany({
                            data: patchAsset.siblingAssetIds.map(assetYId => ({ assetXId: assetId, assetYId })),
                            skipDuplicates: true,
                        }),
                    unknownToUnknownError,
                ),
            ),
            TE.chain(() => updateStudies(this.prismaService, patchAsset.studies)),
            TE.chain(() =>
                deleteStudies(
                    this.prismaService,
                    assetId,
                    patchAsset.studies.map(s => s.studyId),
                ),
            ),
            TE.chain(() => createStudies(this.prismaService, assetId, patchAsset.newStudies)),
            TE.chain(() => this._getAsset(assetId)),
            TE.bindTo('asset'),
            TE.bindW('contacts', () => TE.tryCatch(() => this.prismaService.contact.findMany(), unknownToUnknownError)),
            TE.bindW('elasticSearchResult', ({ asset, contacts }) =>
                TE.tryCatch(
                    () =>
                        createElasticSearchClient().bulk({
                            refresh: true,
                            operations: [
                                { index: { _index: 'swissgeol_asset_asset', _id: asset.assetId } },
                                createElasticSearchAsset(asset, contacts),
                            ],
                        }),
                    unknownToUnknownError,
                ),
            ),
            TE.map(({ asset }) => AssetEditDetail.encode(asset)),
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

const createElasticSearchAsset = (asset: AssetEditDetailFromPostgres, contacts: Contact[]): ElasticSearchAsset => ({
    assetId: asset.assetId,
    titlePublic: asset.titlePublic,
    titleOriginal: asset.titleOriginal,
    sgsId: asset.sgsId,
    createDate: asset.createDate,
    assetKindItemCode: asset.assetKindItemCode,
    languageItemCode: asset.languageItemCode,
    usageCode: asset.publicUse.isAvailable ? 'public' : asset.internalUse.isAvailable ? 'internal' : 'useOnRequest',
    authorIds: pipe(
        asset.assetContacts,
        A.filter(c => c.role === 'author'),
        A.map(c => c.contactId),
    ),
    contactNames: pipe(
        asset.assetContacts,
        A.map(c =>
            pipe(
                contacts,
                A.findFirst(contact => contact.contactId === c.contactId),
            ),
        ),
        A.compact,
        A.map(contact => contact.name),
    ),
    manCatLabelItemCodes: asset.manCatLabelRefs,
});
