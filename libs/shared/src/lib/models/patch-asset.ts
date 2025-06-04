export interface AssetUsageNew {
  isAvailable: boolean;
  statusAssetUseItemCode: 'tobechecked' | 'underclarification' | 'approved';
  startAvailabilityDate: number | null; // todo: Datebrand/DateId
}

export interface AssetLanguageEditNew {
  languageItemCode: string;
}

export interface AssetContactEditNew {
  role: 'author' | 'supplier' | 'initiator'; // todo: Use ContactAssignemtnRole
  contactId: number;
}

/**
 * THis should be moved to v2/asset; however, AssetUsage does not yet match since that one uses LocalDate, where as
 * here we just use number (was Datebrand/DateId).
 *
 * This serves as a drop in replacement right now, however.
 */
export interface PatchAsset {
  titlePublic: string;
  titleOriginal: string | null;
  createDate: number; // todo: Datebrand/DateId
  receiptDate: number;
  publicUse: AssetUsageNew;
  internalUse: AssetUsageNew;
  assetKindItemCode: string;
  assetFormatItemCode: string;
  isNatRel: boolean;
  manCatLabelRefs: string[];
  typeNatRels: string[];
  assetLanguages: AssetLanguageEditNew[];
  assetContacts: AssetContactEditNew[];
  assetFiles: {
    id: number;
    name: string;
    size: number;
    type: 'Normal' | 'Legal'; // todo: we have a type for this?
    legalDocItemCode: 'federalData' | 'permissionForm' | 'contract' | 'other' | null; // todo: we have a type for this?
  }[]; // todo: extract type for assetFiles
  ids: {
    idId: number | null;
    id: string;
    description: string;
  }[]; // todo: extract type for assetFiles
  studies: {
    studyId: string;
    geomText: string;
  }[]; // todo: extract type
  assetMainId: number | null;
  siblingAssetIds: number[];
  newStudies: string[];
  newStatusWorkItemCode: string | null;
  workgroupId: number;
}
