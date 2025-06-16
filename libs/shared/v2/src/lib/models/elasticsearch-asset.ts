import { AssetId } from './asset';
import { ContactId } from './contact';
import { GeometryType } from './geometry';
import { LocalizedItemCode } from './localized-item';
import { UserId } from './user';

export interface ElasticsearchAsset {
  id: AssetId;
  title: string;
  originalTitle: string | null;
  sgsId: number | null;
  createdAt: Date;
  kindCode: LocalizedItemCode;
  languageCodes: LocalizedItemCode[];
  authorIds: ContactId[];
  contactNames: string[];
  topicCodes: LocalizedItemCode[];
  geometryTypes: GeometryType[] | ['None'];
  locations: ElasticPoint[];
  workgroupId: number;
  favoredByUserIds: UserId[];
  data: AssetJSON;
}

export interface ElasticPoint {
  lat: number;
  lon: number;
}

export type AssetJSON = string;
