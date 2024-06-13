import { LV95, LV95X, LV95Y } from '@asset-sg/shared';
import { toLonLat as _toLonLat } from 'ol/proj';

import { WGS, WGSLat, WGSLng, isoWGSLat, isoWGSLng } from '../models';

export const lv95ToWGS = (lv95: LV95): WGS => {
  const y = (lv95.y - 2000000) as LV95Y;
  const x = (lv95.x - 1000000) as LV95X;
  return { lng: lv95ToWGSLng(y, x), lat: lv95ToWGSLat(y, x) };
};

const lv95ToWGSLng = (y: LV95Y, x: LV95X): WGSLng => {
  const y_aux = (y - 600000) / 1000000;
  const x_aux = (x - 200000) / 1000000;

  let lng =
    2.6779094 +
    4.728982 * y_aux +
    0.791484 * y_aux * x_aux +
    0.1306 * y_aux * Math.pow(x_aux, 2) -
    0.0436 * Math.pow(y_aux, 3);

  lng = (lng * 100) / 36;

  return isoWGSLng.wrap(lng);
};

const lv95ToWGSLat = (y: LV95Y, x: LV95X): WGSLat => {
  const y_aux = (y - 600000) / 1000000;
  const x_aux = (x - 200000) / 1000000;

  let lat =
    16.9023892 +
    3.238272 * x_aux -
    0.270978 * Math.pow(y_aux, 2) -
    0.002528 * Math.pow(x_aux, 2) -
    0.0447 * Math.pow(y_aux, 2) * x_aux -
    0.014 * Math.pow(x_aux, 3);

  lat = (lat * 100) / 36;

  return isoWGSLat.wrap(lat);
};

const DECtoSEX = (angle: number) => {
  const deg = angle;
  const min = (angle - deg) * 60;
  const sec = ((angle - deg) * 60 - min) * 60;

  return sec + min * 60.0 + deg * 3600.0;
};

const WGStoLV95y = (lat: number, lng: number): LV95Y => {
  const lat_sex = DECtoSEX(lat);
  const lng_sex = DECtoSEX(lng);

  const lat_aux = (lat_sex - 169028.66) / 10000;
  const lng_aux = (lng_sex - 26782.5) / 10000;

  const y =
    600072.37 +
    211455.93 * lng_aux -
    10938.51 * lng_aux * lat_aux -
    0.36 * lng_aux * Math.pow(lat_aux, 2) -
    44.54 * Math.pow(lng_aux, 3);

  return (y + 2000000) as LV95Y;
};

const WGStoLV95x = (lat: number, lng: number) => {
  const lat_sex = DECtoSEX(lat);
  const lng_sex = DECtoSEX(lng);

  const lat_aux = (lat_sex - 169028.66) / 10000;
  const lng_aux = (lng_sex - 26782.5) / 10000;

  const x =
    200147.07 +
    308807.95 * lat_aux +
    3745.25 * Math.pow(lng_aux, 2) +
    76.63 * Math.pow(lat_aux, 2) -
    194.56 * Math.pow(lng_aux, 2) * lat_aux +
    119.79 * Math.pow(lat_aux, 3);

  return (x + 1000000) as LV95X;
};

export const WGStoLV95 = ([lng, lat]: [lng: number, lat: number]): LV95 => ({
  x: WGStoLV95x(lat, lng),
  y: WGStoLV95y(lat, lng),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toLonLat: (coord: [number, number]) => [number, number] = _toLonLat as any;
