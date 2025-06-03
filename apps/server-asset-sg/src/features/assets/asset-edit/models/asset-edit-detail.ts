import { DT } from '@asset-sg/core';
import { AssetContactEdit, AssetLanguageEdit, DateIdFromDate, LinkedAsset } from '@asset-sg/shared';
import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';

import { AssetFilesFromPostgres } from './AssetDetailFromPostgres';
import { PostgresAllStudies } from '@/features/assets/asset-edit/utils/postgres-studies';

export const AssetEditDetailFromPostgres = pipe(
  D.struct({
    assetId: D.number,
    titlePublic: D.string,
    titleOriginal: D.nullable(D.string),
    createDate: DateIdFromDate,
    receiptDate: DateIdFromDate,
    isPublic: D.boolean,
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
        D.map((a) => a.manCatLabelItemCode),
      ),
    ),
    typeNatRels: D.array(
      pipe(
        D.struct({ natRelItemCode: D.string }),
        D.map((a) => a.natRelItemCode),
      ),
    ),
    assetMain: DT.optionFromNullable(LinkedAsset),
    subordinateAssets: D.array(LinkedAsset),
    siblingXAssets: pipe(
      D.array(
        pipe(
          D.struct({ assetY: LinkedAsset }),
          D.map((a) => a.assetY),
        ),
      ),
    ),
    siblingYAssets: D.array(
      pipe(
        D.struct({ assetX: LinkedAsset }),
        D.map((a) => a.assetX),
      ),
    ),
    assetFiles: AssetFilesFromPostgres,
    workgroupId: D.number,
    studies: PostgresAllStudies,
  }),
);

export type AssetEditDetailFromPostgres = D.TypeOf<typeof AssetEditDetailFromPostgres>;
