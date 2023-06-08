import { DateId } from './DateStruct';

export type ElasticSearchUsageCode = 'public' | 'internal' | 'useOnRequest';

export interface ElasticSearchAsset {
    assetId: number;
    titlePublic: string;
    titleOriginal: string;
    sgsId: number | null;
    createDate: DateId;
    assetKindItemCode: string;
    languageItemCode: string;
    usageCode: ElasticSearchUsageCode;
    authorIds: number[];
    contactNames: string[];
    manCatLabelItemCodes: string[];
}
