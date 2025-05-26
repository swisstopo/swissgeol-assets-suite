import { AssetSearchResultItem, StudyAccessType } from '@asset-sg/shared/v2';

export const mapAssetAccessToAccessType = (asset: AssetSearchResultItem) => {
  return asset.isPublic ? StudyAccessType.Public : StudyAccessType.Internal;
};
