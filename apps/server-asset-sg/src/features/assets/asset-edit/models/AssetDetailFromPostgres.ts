import { DT } from '@asset-sg/core';
import {
  AssetContactRole,
  AssetFileType,
  DateIdFromDate,
  LegalDocItemCode,
  LinkedAsset,
  makeUsageCode,
} from '@asset-sg/shared';
import { pipe } from 'fp-ts/function';
import * as C from 'io-ts/Codec';
import * as D from 'io-ts/Decoder';

import { PostgresAllStudies } from '@/features/assets/asset-edit/utils/postgres-studies';

export const AssetFileFromPostgres = D.struct({
  id: D.number,
  fileName: D.string,
  fileNameAlias: D.nullable(D.string),
  size: DT.numberFromBigint,
  type: AssetFileType,
  legalDocItemCode: D.nullable(LegalDocItemCode),
  pageCount: D.nullable(D.number),
});

export const AssetFilesFromPostgres = pipe(
  D.array(
    D.struct({
      file: AssetFileFromPostgres,
    })
  ),
  D.map((a) => a.map((b) => b.file))
);

export const AssetDetailFromPostgres = pipe(
  D.struct({
    assetId: D.number,
    titlePublic: D.string,
    titleOriginal: D.string,
    createDate: DateIdFromDate,
    lastProcessedDate: DateIdFromDate,
    publicUse: pipe(
      D.struct({ isAvailable: D.boolean }),
      D.map((a) => a.isAvailable)
    ),
    internalUse: pipe(
      D.struct({ isAvailable: D.boolean }),
      D.map((a) => a.isAvailable)
    ),
    assetKindItemCode: D.string,
    assetFormatItemCode: D.string,
    ids: D.array(
      D.struct({
        id: D.string,
        description: D.string,
      })
    ),
    assetLanguages: D.array(
      D.struct({
        languageItem: D.struct({
          languageItemCode: C.string,
          geolCode: C.string,
          name: C.string,
          nameDe: C.string,
          nameFr: C.string,
          nameIt: C.string,
          nameEn: C.string,
          description: C.string,
          descriptionDe: C.string,
          descriptionFr: C.string,
          descriptionIt: C.string,
          descriptionEn: C.string,
        }),
      })
    ),
    assetContacts: D.array(
      D.struct({
        role: AssetContactRole,
        contact: D.struct({
          name: D.string,
          locality: D.nullable(D.string),
          contactKindItemCode: D.string,
        }),
      })
    ),
    manCatLabelRefs: D.array(
      pipe(
        D.struct({ manCatLabelItemCode: D.string }),
        D.map((a) => a.manCatLabelItemCode)
      )
    ),
    assetFormatCompositions: D.array(
      pipe(
        D.struct({ assetFormatItemCode: D.string }),
        D.map((a) => a.assetFormatItemCode)
      )
    ),
    typeNatRels: D.array(
      pipe(
        D.struct({ natRelItemCode: D.string }),
        D.map((a) => a.natRelItemCode)
      )
    ),
    assetMain: DT.optionFromNullable(LinkedAsset),
    subordinateAssets: D.array(LinkedAsset),
    siblingYAssets: pipe(
      D.array(
        pipe(
          D.struct({ assetX: LinkedAsset }),
          D.map((a) => a.assetX)
        )
      )
    ),
    siblingXAssets: D.array(
      pipe(
        D.struct({ assetY: LinkedAsset }),
        D.map((a) => a.assetY)
      )
    ),
    statusWorks: D.array(
      D.struct({
        statusWorkItemCode: D.string,
        statusWorkDate: DT.date,
      })
    ),
    assetFiles: AssetFilesFromPostgres,
    studies: PostgresAllStudies,
  }),
  D.map((a) => {
    const { publicUse, internalUse, ...rest } = a;
    return {
      ...rest,
      usageCode: makeUsageCode(publicUse, internalUse),
    };
  })
);
export type AssetDetailFromPostgres = D.TypeOf<typeof AssetDetailFromPostgres>;
