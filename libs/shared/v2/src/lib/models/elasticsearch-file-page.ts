import { AssetId } from './asset';
import { AssetFileId } from './asset-file';
import { ContactId } from './contact';
import { ElasticsearchLocalDate, ElasticsearchPoint } from './elasticsearch-asset';
import { GeometryType } from './geometry';
import { LocalizedItemCode } from './localized-item';
import { AssetSearchUsageCode } from './search/search-query';
import { UserId } from './user';

/**
 * Corresponds to the index mapping defined in swissgeol_asset_file.json.
 *
 * Each document represents a single page of a file's fulltext content,
 * with denormalized asset metadata fields for filtering.
 */
export interface ElasticsearchFilePage {
  id: string;
  fileId: AssetFileId;
  assetId: AssetId;
  fileName: string;
  page: number;
  content: string;
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
  alternativeIds: string[];
  status: string;
}
