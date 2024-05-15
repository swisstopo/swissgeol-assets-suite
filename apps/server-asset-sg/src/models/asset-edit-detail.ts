import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';

import { DT } from '@asset-sg/core';
import { AssetContactEdit, AssetLanguageEdit, DateIdFromDate, LinkedAsset, StatusAssetUseCode } from '@asset-sg/shared';

import { PostgresAllStudies } from '@/utils/postgres-studies/postgres-studies';

export const AssetEditDetailFromPostgres = pipe(
    D.struct({
        assetId: D.number,
        titlePublic: D.string,
        titleOriginal: D.nullable(D.string),
        createDate: DateIdFromDate,
        receiptDate: DateIdFromDate,
        lastProcessedDate: DT.date,
        processor: D.nullable(D.string),
        publicUse: D.struct({
            isAvailable: D.boolean,
            statusAssetUseItemCode: StatusAssetUseCode,
            startAvailabilityDate: DT.optionFromNullable(DateIdFromDate),
        }),
        internalUse: D.struct({
            isAvailable: D.boolean,
            statusAssetUseItemCode: StatusAssetUseCode,
            startAvailabilityDate: DT.optionFromNullable(DateIdFromDate),
        }),
        assetKindItemCode: D.string,
        assetFormatItemCode: D.string,
        isNatRel: D.boolean,
        sgsId: D.nullable(D.number),
        geolDataInfo: D.nullable(D.string),
        geolContactDataInfo: D.nullable(D.string),
        geolAuxDataInfo: D.nullable(D.string),
        municipality: D.nullable(D.string),
        ids: D.array(
            D.struct({
                idId: D.number,
                id: D.string,
                description: D.string,
            }),
        ),
        assetLanguages: D.array(AssetLanguageEdit),
        assetContacts: D.array(AssetContactEdit),
        manCatLabelRefs: D.array(
            pipe(
                D.struct({ manCatLabelItemCode: D.string }),
                D.map(a => a.manCatLabelItemCode),
            ),
        ),
        assetFormatCompositions: D.array(
            pipe(
                D.struct({ assetFormatItemCode: D.string }),
                D.map(a => a.assetFormatItemCode),
            ),
        ),
        typeNatRels: D.array(
            pipe(
                D.struct({ natRelItemCode: D.string }),
                D.map(a => a.natRelItemCode),
            ),
        ),
        assetMain: DT.optionFromNullable(LinkedAsset),
        subordinateAssets: D.array(LinkedAsset),
        siblingXAssets: pipe(
            D.array(
                pipe(
                    D.struct({ assetY: LinkedAsset }),
                    D.map(a => a.assetY),
                ),
            ),
        ),
        siblingYAssets: D.array(
            pipe(
                D.struct({ assetX: LinkedAsset }),
                D.map(a => a.assetX),
            ),
        ),
        statusWorks: D.array(
            D.struct({
                statusWorkItemCode: D.string,
                statusWorkDate: DT.date,
            }),
        ),
        assetFiles: pipe(
            D.array(
                D.struct({
                    file: D.struct({
                        fileId: D.number,
                        fileName: D.string,
                        fileSize: DT.bigint,
                    }),
                }),
            ),
            D.map(a => a.map(b => b.file)),
        ),
        studies: PostgresAllStudies,
    }),
);

export type AssetEditDetailFromPostgres = D.TypeOf<typeof AssetEditDetailFromPostgres>;
