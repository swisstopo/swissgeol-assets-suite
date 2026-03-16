import { AssetId } from './asset';
import { AssetFileId } from './asset-file';
import { ContactId } from './contact';
import { ElasticsearchLocalDate } from './elasticsearch-asset';
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
export interface ElasticsearchFile {
  fileId: AssetFileId;
  assetId: AssetId;
  assetTitle: string;
  fileName: string;
  page: number;
  content: string;
  workgroupId: number;
  usageCode: AssetSearchUsageCode;
  kindCode: LocalizedItemCode;
  status: string;
  languageCodes: LocalizedItemCode[];
  topicCodes: LocalizedItemCode[];
  geometryTypes: GeometryType[] | ['None'];
  authorIds: ContactId[];
  favoredByUserIds: UserId[];
  createdAt: ElasticsearchLocalDate;
}
