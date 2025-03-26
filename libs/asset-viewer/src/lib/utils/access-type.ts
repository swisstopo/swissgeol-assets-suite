import { AssetEditDetail } from '@asset-sg/shared';
import { StudyAccessType } from '@asset-sg/shared/v2';

export const mapAssetAccessToAccessType = (asset: AssetEditDetail) =>
  asset.publicUse.isAvailable
    ? StudyAccessType.Public
    : asset.internalUse.isAvailable
    ? StudyAccessType.Internal
    : StudyAccessType.Restricted;
