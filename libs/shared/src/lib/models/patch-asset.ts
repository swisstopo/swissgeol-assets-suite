import { CT } from '@asset-sg/core';
import * as C from 'io-ts/Codec';

import { AssetContactEdit, AssetLanguageEdit } from './asset-edit';
import { AssetUsage } from './asset-usage';
import { DateId } from './DateStruct';

export const PatchAsset = C.struct({
  titlePublic: C.string,
  titleOriginal: C.string,
  createDate: DateId,
  receiptDate: DateId,
  publicUse: AssetUsage,
  internalUse: AssetUsage,
  assetKindItemCode: C.string,
  assetFormatItemCode: C.string,
  isNatRel: C.boolean,
  manCatLabelRefs: C.array(C.string),
  typeNatRels: C.array(C.string),
  assetLanguages: C.array(AssetLanguageEdit),
  assetContacts: C.array(AssetContactEdit),
  ids: C.array(
    C.struct({
      idId: CT.optionFromNullable(C.number),
      id: C.string,
      description: C.string,
    })
  ),
  studies: C.array(
    C.struct({
      studyId: C.string,
      geomText: C.string,
    })
  ),
  assetMainId: CT.optionFromNullable(C.number),
  siblingAssetIds: C.array(C.number),
  newStudies: C.array(C.string),
  newStatusWorkItemCode: CT.optionFromNullable(C.string),
  workgroupId: C.number,
});
export type PatchAsset = C.TypeOf<typeof PatchAsset>;
