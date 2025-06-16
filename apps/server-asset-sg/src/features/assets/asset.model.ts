import { AssetData, UserId } from '@asset-sg/shared/v2';

export interface CreateAssetData extends AssetData {
  creatorId: UserId;
}
