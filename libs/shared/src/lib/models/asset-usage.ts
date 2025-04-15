import { CT } from '@asset-sg/core';
import * as C from 'io-ts/Codec';
import * as D from 'io-ts/Decoder';

import { DateId } from './DateStruct';

export const StatusAssetUseCode = C.fromDecoder(
  D.union(D.literal('tobechecked'), D.literal('underclarification'), D.literal('approved')),
);
export type StatusAssetUseCode = C.TypeOf<typeof StatusAssetUseCode>;

export const AssetUsage = C.struct({
  isAvailable: C.boolean,
  statusAssetUseItemCode: StatusAssetUseCode,
  startAvailabilityDate: CT.optionFromNullable(DateId),
});
export type AssetUsage = C.TypeOf<typeof AssetUsage>;
