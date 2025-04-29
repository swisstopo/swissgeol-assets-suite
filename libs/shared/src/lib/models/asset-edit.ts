import { CT } from '@asset-sg/core';
import { struct } from 'fp-ts/Eq';
import { Eq as eqNumber } from 'fp-ts/number';
import { Eq as eqString } from 'fp-ts/string';
import * as C from 'io-ts/Codec';

import {
  AssetContactRole,
  AssetFileType,
  eqAssetContactRole,
  LegalDocItemCode,
  LinkedAsset,
  StatusWork,
} from './asset-detail';
import { AssetUsage } from './asset-usage';
import { DateId } from './DateStruct';

const _PatchContact = {
  name: C.string,
  street: C.nullable(C.string),
  houseNumber: C.nullable(C.string),
  plz: C.nullable(C.string),
  locality: C.nullable(C.string),
  country: C.nullable(C.string),
  telephone: C.nullable(C.string),
  email: C.nullable(C.string),
  website: C.nullable(C.string),
  contactKindItemCode: C.string,
};
export const PatchContact = C.struct(_PatchContact);

export type PatchContact = C.TypeOf<typeof PatchContact>;

export const ContactEdit = C.struct({
  id: C.number,
  ..._PatchContact,
});

export type ContactEdit = C.TypeOf<typeof ContactEdit>;

export const AssetLanguageEdit = C.struct({
  languageItemCode: C.string,
});

export type AssetLanguageEdit = C.TypeOf<typeof AssetLanguageEdit>;

export const eqAssetLanguageEdit = struct({
  languageItemCode: eqString,
});

export const AssetContactEdit = C.struct({
  role: AssetContactRole,
  contactId: C.number,
});

export type AssetContactEdit = C.TypeOf<typeof AssetContactEdit>;

export const eqAssetContactEdit = struct({
  role: eqAssetContactRole,
  contactId: eqNumber,
});

export const AssetFile = C.struct({
  id: C.number,
  fileName: C.string,
  fileNameAlias: C.nullable(C.string),
  size: C.number,
  type: AssetFileType,
  legalDocItemCode: C.nullable(LegalDocItemCode),
  pageCount: C.nullable(C.number),
});

export type AssetFile = C.TypeOf<typeof AssetFile>;

export const BaseAssetEditDetail = {
  assetId: C.number,
  titlePublic: C.string,
  titleOriginal: C.nullable(C.string),
  createDate: DateId,
  receiptDate: DateId,
  lastProcessedDate: CT.DateFromISOString,
  processor: C.nullable(C.string),
  publicUse: AssetUsage,
  internalUse: AssetUsage,
  assetKindItemCode: C.string,
  assetFormatItemCode: C.string,
  isNatRel: C.boolean,
  sgsId: C.nullable(C.number),
  geolDataInfo: C.nullable(C.string),
  geolContactDataInfo: C.nullable(C.string),
  geolAuxDataInfo: C.nullable(C.string),
  municipality: C.nullable(C.string),
  ids: C.array(C.struct({ idId: C.number, id: C.string, description: C.string })),
  assetLanguages: C.array(AssetLanguageEdit),
  assetContacts: C.array(AssetContactEdit),
  manCatLabelRefs: C.array(C.string),
  assetFormatCompositions: C.array(C.string),
  typeNatRels: C.array(C.string),
  assetMain: CT.optionFromNullable(LinkedAsset),
  subordinateAssets: C.array(LinkedAsset),
  siblingXAssets: C.array(LinkedAsset),
  siblingYAssets: C.array(LinkedAsset),
  statusWorks: C.array(StatusWork),
  assetFiles: C.array(AssetFile),
  workgroupId: C.number,
};
const base = C.struct(BaseAssetEditDetail);
export type BaseAssetEditDetail = C.TypeOf<typeof base>;

export const AssetEditDetail = C.struct({
  ...BaseAssetEditDetail,
  studies: C.array(C.struct({ assetId: C.number, studyId: C.string, geomText: C.string })),
});
export type AssetEditDetail = C.TypeOf<typeof AssetEditDetail>;

// todo: once AssetEditDetail is removed, a similar property could exist on the new model to avoid this helper method
export const hasHistoricalData = (asset: AssetEditDetail): boolean => {
  return !!(
    asset.geolAuxDataInfo ||
    asset.geolContactDataInfo ||
    asset.geolDataInfo ||
    asset.municipality ||
    asset.sgsId
  );
};
