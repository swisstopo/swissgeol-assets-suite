import { ElasticPoint, LV95 } from '@asset-sg/shared';
import proj4 from 'proj4';

const lv95Projection =
  '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs';
const wgs84Projection = proj4.WGS84;

export const mapLv95ToElastic = (lv95: LV95): ElasticPoint => {
  const wgs = proj4(lv95Projection, wgs84Projection, [lv95.x as number, lv95.y as number]);
  return { lat: wgs[1], lon: wgs[0] };
};
