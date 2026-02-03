import { AssetId } from './asset';
import { AssetSearchUsageCode } from './asset-search/asset-search-query';
import { ContactId } from './contact';
import { GeometryType } from './geometry';
import { LocalizedItemCode } from './localized-item';
import { UserId } from './user';

export interface ElasticsearchAsset {
  id: AssetId;
  title: string;
  originalTitle: string | null;
  sgsId: number | null;
  createdAt: ElasticsearchLocalDate;
  usageCode: AssetSearchUsageCode;
  kindCode: LocalizedItemCode;
  languageCodes: LocalizedItemCode[];
  authorIds: ContactId[];
  contactNames: string[];
  topicCodes: LocalizedItemCode[];
  geometryTypes: GeometryType[] | ['None'];
  locations: ElasticsearchPoint[];
  workgroupId: number;
  favoredByUserIds: UserId[];
  data: AssetJSON;
  alternativeIds: string[];
}

export interface ElasticsearchPoint {
  lat: number;
  lon: number;
}

export type ElasticsearchLocalDate = `${number}-${number}-${number}`;

export type AssetJSON = string;
