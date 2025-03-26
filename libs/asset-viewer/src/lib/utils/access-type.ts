import { AssetEditDetail } from '@asset-sg/shared';
import { StudyAccessType } from '@asset-sg/shared/v2';

export const mapAssetAccessToAccessType = (asset: AssetEditDetail) => {
  if (asset.publicUse.isAvailable) {
    return StudyAccessType.Public;
  }

  return asset.internalUse.isAvailable ? StudyAccessType.Internal : StudyAccessType.Restricted;
};
