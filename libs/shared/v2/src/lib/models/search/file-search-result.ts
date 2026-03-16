import { AssetId } from '../asset';
import { AssetFileId } from '../asset-file';
import { PageStats } from './asset-search-result';

export interface FileSearchResultPage {
  page: number;
  highlights: string[];
}

export interface FileSearchResultItem {
  fileId: AssetFileId;
  assetId: AssetId;
  assetTitle: string;
  fileName: string;
  pages: FileSearchResultPage[];
}

export interface FileSearchResult {
  page: PageStats;
  data: FileSearchResultItem[];
}

export const makeEmptyFileSearchResults = (): FileSearchResult => ({
  page: {
    size: 0,
    offset: 0,
    total: 0,
  },
  data: [],
});
