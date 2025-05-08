import { AssetSearchResultItem, StudyAccessType } from '@asset-sg/shared/v2';

export const mapAssetAccessToAccessType = (asset: AssetSearchResultItem) => {
  if (asset.publicUse.isAvailable) {
    return StudyAccessType.Public;
  }

  return asset.internalUse.isAvailable ? StudyAccessType.Internal : StudyAccessType.Restricted;
};
