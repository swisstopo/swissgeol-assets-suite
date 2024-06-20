import { pipe } from 'fp-ts/function';
import * as C from 'io-ts/Codec';
import * as D from 'io-ts/Decoder';
import * as TEq from 'io-ts/Eq';

export interface LV95XBrand {
  readonly LV95X: unique symbol;
}

// official bounds for LV95 X are 1075346.31 and 1299941.79, but the data set delivers coordinates outside of this range

const minLV95X = 1000000 as LV95X;
const maxLV95X = 1999999 as LV95X;

export type LV95X = number & LV95XBrand;
export const LV95X = pipe(
  C.number,
  C.refine((n): n is LV95X => n >= minLV95X && n <= maxLV95X, 'LV95X')
);
export const eqLV95X = TEq.number;

export interface LV95YBrand {
  readonly LV95Y: unique symbol;
}

// official bounds for LV95 Y are 2485071.58 and 2828515.82, but the data set delivers coordinates outside of this range
const minLV95Y = 2000000 as LV95Y;
const maxLV95Y = 2999999 as LV95Y;

export type LV95Y = number & LV95YBrand;
export const LV95Y = pipe(
  C.number,
  C.refine((n): n is LV95Y => n >= minLV95Y && n <= maxLV95Y, 'LV95Y')
);
export const eqLV95Y = TEq.number;

export const LV95 = C.struct({
  x: LV95X,
  y: LV95Y,
});
export type LV95 = C.TypeOf<typeof LV95>;
export const eqLV95 = TEq.struct({
  x: eqLV95X,
  y: eqLV95Y,
});

export const toPosition = (lv95: LV95) => [lv95.x, lv95.y];

export const LV95Array = C.array(LV95);
export type LV95Array = C.TypeOf<typeof LV95Array>;
export const eqLV95Array = TEq.array(eqLV95);
export const toPositions = (lv95s: LV95[]) => lv95s.map(toPosition);

const makeLV95FromSeparatedString = (codecName: string, separator: string) => {
  const decoder = pipe(
    D.string,
    D.parse((s) => {
      const parts = s.split(separator);
      if (parts.length !== 2) return D.failure(s, `${codecName}: expected 2 parts, got ${parts.length}`);
      const [y, x] = parts;
      return LV95.decode({ y: +y, x: +x });
    })
  );
  const encoder = {
    encode: (lv95: LV95) => `${lv95.y}${separator}${lv95.x}`,
  };
  return C.make(decoder, encoder);
};

export const LV95FromSpaceSeparatedString = makeLV95FromSeparatedString('LV95FromSpaceSeparatedString', ' ');
type LV95FromSpaceSeparatedString = D.TypeOf<typeof LV95FromSpaceSeparatedString>;

export const LV95FromCommaSeparatedString = makeLV95FromSeparatedString('LV95FromCommaSeparatedString', ',');
type LV95FromCommaSeparatedString = D.TypeOf<typeof LV95FromCommaSeparatedString>;

export const roundToMillimeter = (n: number) => Math.round(n * 1000) / 1000;

export const lv95WithoutPrefix = (lv95: LV95): LV95 => ({
  x: roundToMillimeter(lv95.x - 1000000) as LV95X,
  y: roundToMillimeter(lv95.y - 2000000) as LV95Y,
});

export const lv95RoundedToMillimeter = (lv95: LV95): LV95 => ({
  x: roundToMillimeter(lv95.x) as LV95X,
  y: roundToMillimeter(lv95.y) as LV95Y,
});
