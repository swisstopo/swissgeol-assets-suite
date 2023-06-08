import * as D from 'io-ts/Decoder';

import { BaseAssetDetail, Studies } from '@asset-sg/shared';

export const AssetDetail = D.struct({ ...BaseAssetDetail, studies: Studies });
export interface AssetDetail extends D.TypeOf<typeof AssetDetail> {}
