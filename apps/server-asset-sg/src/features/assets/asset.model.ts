import { CreateAssetData, UserId } from '@asset-sg/shared/v2';

export interface CreateAssetDataWithCreator extends CreateAssetData {
  creatorId: UserId;
}
