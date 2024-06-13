import { BaseAssetDetail, Studies } from '@asset-sg/shared';
import * as D from 'io-ts/Decoder';

export const AssetDetail = D.struct({ ...BaseAssetDetail, studies: Studies });
export type AssetDetail = D.TypeOf<typeof AssetDetail>;
