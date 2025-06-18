import { BaseAsset, Studies } from '@asset-sg/shared';
import { Eq, struct } from 'fp-ts/Eq';
import { Eq as eqNumber } from 'fp-ts/number';
import * as O from 'fp-ts/Option';
import { Eq as eqString } from 'fp-ts/string';
import * as D from 'io-ts/Decoder';

export const Asset = D.struct({ ...BaseAsset, studies: Studies });
export type Asset = D.TypeOf<typeof Asset>;

export interface IdVM {
  idId: O.Option<number>;
  id: string;
  description: string;
}

export const eqIdVM: Eq<IdVM> = struct({
  idId: O.getEq(eqNumber),
  id: eqString,
  description: eqString,
});
