import { ElasticsearchAsset } from '@asset-sg/shared/v2';

export const ASSET_ELASTIC_INDEX = 'swissgeol_asset_asset';
export const FILE_ELASTIC_INDEX = 'swissgeol_asset_file';

export const SEARCH_BATCH_SIZE = 10_000;

/**
 * Fields that are searchable via specific field queries (e.g. id:1234).
 * Note that these fields must be mapped as `keyword` in the Elasticsearch mapping (swissgeol_asset_asset.json).
 */
export const SEARCHABLE_FIELDS: (keyof ElasticsearchAsset)[] = [
  'title',
  'originalTitle',
  'contactNames',
  'sgsId',
  'alternativeIds',
  'id',
];
