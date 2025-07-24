import { Newtype, iso } from 'newtype-ts';

export type WGSLng = Newtype<{ readonly WGSLng: unique symbol }, number>;
export type WGSLat = Newtype<{ readonly WGSLat: unique symbol }, number>;

export const isoWGSLng = iso<WGSLng>();
export const isoWGSLat = iso<WGSLat>();

export interface WGS {
  lng: WGSLng;
  lat: WGSLat;
}
