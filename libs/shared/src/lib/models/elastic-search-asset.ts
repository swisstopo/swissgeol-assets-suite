import { GeometryCode } from './asset-search/asset-search-query';
import { DateId } from './DateStruct';

export type ElasticSearchUsageCode = 'public' | 'internal' | 'useOnRequest';

export interface ElasticSearchAsset {
  assetId: number;
  titlePublic: string;
  titleOriginal: string | null;
  sgsId: number | null;
  createDate: DateId;
  assetKindItemCode: string;
  languageItemCodes: string[];
  usageCode: ElasticSearchUsageCode;
  authorIds: number[];
  contactNames: string[];
  manCatLabelItemCodes: string[];
  geometryCodes: GeometryCode[] | ['None'];
  studyLocations: ElasticPoint[];
  workgroupId: number;
  data: SerializedAssetEditDetail;
}

export interface ElasticPoint {
  lat: number;
  lon: number;
}

export type SerializedAssetEditDetail = string;
