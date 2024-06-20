import * as C from 'io-ts/Codec';
import * as D from 'io-ts/Decoder';

const UsageCodeDecoder = D.union(D.literal('public'), D.literal('internal'), D.literal('useOnRequest'));
export const UsageCode = C.fromDecoder(UsageCodeDecoder);
export type UsageCode = C.TypeOf<typeof UsageCode>;

export const usageCodes: Array<UsageCode> = ['public', 'internal', 'useOnRequest'];

export const makeUsageCode = (publicUseIsAvailable: boolean, internalUseIsAvailable: boolean): UsageCode =>
  publicUseIsAvailable ? 'public' : internalUseIsAvailable ? 'internal' : 'useOnRequest';
