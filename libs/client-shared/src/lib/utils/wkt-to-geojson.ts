import { LineString, LV95, Point, StudyPolygon } from '@asset-sg/shared';

export function wktToGeoJSON(wkt: string) {
  if (wkt.startsWith('POINT')) {
    return parsePoint(wkt);
  } else if (wkt.startsWith('LINESTRING')) {
    return parseLineString(wkt);
  } else if (wkt.startsWith('POLYGON')) {
    return parsePolygon(wkt);
  } else {
    throw new Error(`Unsupported geometry type: ${wkt}`);
  }
}

function parsePoint(wkt: string): Point {
  const coord = getCoordinatesFromWKT(wkt)[0];
  return { _tag: 'Point', coord };
}

function parseLineString(wkt: string): LineString {
  const coords = getCoordinatesFromWKT(wkt);
  return { _tag: 'LineString', coords };
}

function parsePolygon(wkt: string): StudyPolygon {
  const coords = getCoordinatesFromWKT(wkt);
  return { _tag: 'Polygon', coords };
}

function getCoordinatesFromWKT(wkt: string): LV95[] {
  const match = wkt.startsWith('POLYGON') ? wkt.match(/\(\(([^)]+)\)\)/) : wkt.match(/\(([^)]+)\)/);
  if (!match) {
    return [];
  }
  const coordinateStrings = match[1].split(',');
  return coordinateStrings.map((coordStr) => {
    const [y, x] = coordStr.trim().split(' ').map(Number);
    return { x, y } as LV95;
  });
}
