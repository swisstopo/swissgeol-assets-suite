import { AssetSearchResultItem, GeometryAccessType } from '@asset-sg/shared/v2';

export const mapAssetAccessToAccessType = (asset: AssetSearchResultItem) => {
  return asset.isPublic ? GeometryAccessType.Public : GeometryAccessType.Internal;
};
