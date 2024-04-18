import { DateId } from './DateStruct';

export type ElasticSearchUsageCode = 'public' | 'internal' | 'useOnRequest';

export interface ElasticSearchAsset {
    assetId: number;
    titlePublic: string;
    titleOriginal: string;
    sgsId: number | null;
    createDate: DateId;
    assetKindItemCode: string;

    // TODO Change this to whatever the ES index will use for multi-language assets (DVA, 2024-04-18).
    //      For now, we just leave it as is and use only the first language of each assets for searches.
    languageItemCode: string;
    usageCode: ElasticSearchUsageCode;
    authorIds: number[];
    contactNames: string[];
    manCatLabelItemCodes: string[];
}
