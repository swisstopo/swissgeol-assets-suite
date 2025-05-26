import * as C from 'io-ts/Codec';
import * as D from 'io-ts/Decoder';

const UsageCodeDecoder = D.union(D.literal('public'), D.literal('internal'));
export const UsageCode = C.fromDecoder(UsageCodeDecoder);
export type UsageCode = C.TypeOf<typeof UsageCode>;

export const usageCodes: Array<UsageCode> = ['public', 'internal'];

export const makeUsageCode = (isPublic: boolean): UsageCode => (isPublic ? 'public' : 'internal');
