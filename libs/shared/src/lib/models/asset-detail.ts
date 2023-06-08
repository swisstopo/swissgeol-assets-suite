import { Ord as ordDate } from 'fp-ts/Date';
import { Eq } from 'fp-ts/Eq';
import { contramap, reverse } from 'fp-ts/Ord';
import { Eq as eqString } from 'fp-ts/string';
import * as C from 'io-ts/Codec';
import * as D from 'io-ts/Decoder';

import { CT } from '@asset-sg/core';

import { DateId } from './DateStruct';
import { UsageCode } from './usage';

export const LinkedAsset = C.struct({
    assetId: C.number,
    titlePublic: C.string,
});
export type LinkedAsset = C.TypeOf<typeof LinkedAsset>;

export const StatusWork = C.struct({
    statusWorkItemCode: C.string,
    statusWorkDate: CT.DateFromISOString,
});
export type StatusWork = C.TypeOf<typeof StatusWork>;

export const ordStatusWorkByDate = contramap((sw: StatusWork) => sw.statusWorkDate)(ordDate);
export const ordStatusWorkByDateDesc = reverse(ordStatusWorkByDate);

export const AssetContactRole = C.fromDecoder(
    D.union(D.literal('author'), D.literal('initiator'), D.literal('supplier')),
);
export type AssetContactRole = C.TypeOf<typeof AssetContactRole>;
export const eqAssetContactRole: Eq<AssetContactRole> = eqString;

export const BaseAssetDetail = {
    assetId: C.number,
    titlePublic: C.string,
    titleOriginal: C.string,
    createDate: DateId,
    lastProcessedDate: DateId,
    usageCode: UsageCode,
    assetKindItemCode: C.string,
    assetFormatItemCode: C.string,
    languageItemCode: C.string,
    ids: C.array(
        C.struct({
            id: C.string,
            description: C.string,
        }),
    ),
    assetContacts: C.array(
        C.struct({
            role: AssetContactRole,
            contact: C.struct({
                name: C.string,
                locality: C.nullable(C.string),
                contactKindItemCode: C.string,
            }),
        }),
    ),
    manCatLabelRefs: C.array(C.string),
    assetFormatCompositions: C.array(C.string),
    typeNatRels: C.array(C.string),
    assetMain: CT.optionFromNullable(LinkedAsset),
    subordinateAssets: C.array(LinkedAsset),
    siblingXAssets: C.array(LinkedAsset),
    siblingYAssets: C.array(LinkedAsset),
    statusWorks: C.array(StatusWork),
    assetFiles: C.array(C.struct({ fileId: C.number, fileName: C.string, fileSize: CT.BigIntFromString })),
};
