import { pipe } from 'fp-ts/function';
import { Ord as OrdNumber } from 'fp-ts/number';
import type { Ord } from 'fp-ts/Ord';
import * as C from 'io-ts/Codec';
import * as D from 'io-ts/Decoder';

import { DT } from '@asset-sg/core';

export interface DateIdBrand {
    readonly DateId: unique symbol;
}
export type DateId = number & DateIdBrand;
export const DateIdDecoder = pipe(
    D.number,
    D.refine((n): n is DateId => n >= 100 && n <= 99991231, 'DateId'),
);
export const DateId = C.fromDecoder(DateIdDecoder);
export const DateIdOrd: Ord<DateId> = OrdNumber;

export const DateStruct = D.struct({
    dateId: DateId,
    date: DT.date,
});
export type DateStruct = D.TypeOf<typeof DateStruct>;

export const dateFromDateId = (dateId: DateId) =>
    new Date(Date.UTC(dateId / 10000, (dateId % 10000) / 100 - 1, dateId % 100));

export const dateIdFromDate = (d: Date) => (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()) as DateId;
export const DateIdFromDate = C.make(pipe(DT.date, D.map(dateIdFromDate)), { encode: dateFromDateId });

export const dateStructFromDate = (d: Date): DateStruct => ({ dateId: dateIdFromDate(d), date: d });

export const dateStructFromDateId = (dateId: DateId): DateStruct => ({ dateId, date: dateFromDateId(dateId) });

export const DateStructFromDateDecoder = pipe(DT.date, D.map(dateStructFromDate));
export const DateStructFromDateIdDecoder = pipe(DateId, D.map(dateStructFromDateId));

export const DateStructFromDateIdCodec = C.make(DateStructFromDateIdDecoder, { encode: d => d.dateId });
