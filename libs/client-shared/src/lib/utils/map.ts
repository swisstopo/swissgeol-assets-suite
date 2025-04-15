import { isNotNil } from '@asset-sg/core';
import { Geom, LV95, Studies, Study } from '@asset-sg/shared';
import * as A from 'fp-ts/Array';
import { pipe } from 'fp-ts/function';
import * as NEA from 'fp-ts/NonEmptyArray';
import * as O from 'fp-ts/Option';
import { Coordinate } from 'ol/coordinate';
import * as Extent from 'ol/extent';
import Feature from 'ol/Feature';
import { LineString, Point, Polygon, SimpleGeometry } from 'ol/geom';
import { fromExtent as polygonFromExtent } from 'ol/geom/Polygon';
import Map from 'ol/Map';
import { fromLonLat, transform } from 'ol/proj';
import { register } from 'ol/proj/proj4';
import { Style } from 'ol/style';

import proj4 from 'proj4';
import { isoWGSLat, isoWGSLng } from '../models';
import { WindowService } from '../services';

import { lv95ToWGS } from './wgs';

proj4.defs(
  'EPSG:2056',
  '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs',
);
register(proj4);

export const createFeaturesFromStudy = (
  study: Study,
  featureStyles: { point: Style | Style[]; polygon: Style | Style[]; lineString: Style | Style[] },
) => ({
  ...study,
  olGeometry: decorateFeature(
    new Feature({
      geometry: Geom.matchStrict<SimpleGeometry>({
        Point: (g) => new Point(olCoordsFromLV95Array([g.coord])[0]),
        Polygon: (g) => new Polygon([olCoordsFromLV95Array(g.coords)]),
        LineString: (g) => new LineString(olCoordsFromLV95Array(g.coords)),
      })(study.geom),
    }),
    {
      style: Geom.matchStrict({
        Point: () => featureStyles.point,
        Polygon: () => featureStyles.polygon,
        LineString: () => featureStyles.lineString,
      })(study.geom),
      id: `${study.studyId}`,
    },
    { assetSgFeatureType: study.geom._tag },
  ),
});

export const createFeaturesFromStudies = (
  studies: Studies,
  featureStyles: { point: Style | Style[]; polygon: Style | Style[]; lineString: Style | Style[] },
) =>
  pipe(
    studies,
    A.map((s) => createFeaturesFromStudy(s, featureStyles)),
  );

export const decorateFeature = (
  feature: Feature,
  attributes: { style: Style | Style[]; id: string | number },
  properties: Record<string, string | number> = {},
  // attributes: Partial<{ style: Style; id: string | number; assetSgFeatureType: string }>,
) => {
  if (attributes.style) feature.setStyle(attributes.style);
  if (attributes.id != null) feature.setId(attributes.id);
  feature.setProperties(properties);
  return feature;
};

export const olCoordsFromLV95Array = (coords: LV95[]): Coordinate[] => coords.map(olCoordsFromLV95);

export const olCoordsFromLV95 = (lv95Coords: LV95): Coordinate => {
  const wgsCoords = lv95ToWGS(lv95Coords);
  return fromLonLat([isoWGSLng.unwrap(wgsCoords.lng), isoWGSLat.unwrap(wgsCoords.lat)]);
};

export const zoomToStudies = (
  windowService: WindowService,
  olMap: Map,
  studies: Study[],
  fractionOfMapToUse: number,
) => {
  if (fractionOfMapToUse < 0 || fractionOfMapToUse > 1) {
    console.warn('fractionOfMapToUse must be between 0 and 1');
    return;
  }
  const viewMoveAction = pipe(
    studies,
    A.map((a) =>
      Geom.matchStrict({
        Point: (g) => olCoordsFromLV95Array([g.coord]),
        Polygon: (g) => olCoordsFromLV95Array(g.coords),
        LineString: (g) => olCoordsFromLV95Array(g.coords),
      })(a.geom),
    ),
    A.flatten,
    NEA.fromArray,
    O.map((a) =>
      a.length === 1
        ? { _tag: 'centerOn' as const, coord: a[0] }
        : { _tag: 'fit' as const, polygon: pipe(findExtentFromPoints(a), polygonFromExtent) },
    ),
  );

  if (O.isSome(viewMoveAction)) {
    const view = olMap.getView();
    const oldCenter = view.getCenter();
    const oldZoom = view.getZoom();
    const size = olMap.getSize();
    if (isNotNil(size)) {
      switch (viewMoveAction.value._tag) {
        case 'centerOn': {
          view.setZoom(18);
          view.centerOn(viewMoveAction.value.coord, size, [
            size[0] * (1 - fractionOfMapToUse + fractionOfMapToUse / 2),
            size[1] / 2,
          ]);
          break;
        }
        case 'fit': {
          const horizontalPadding = size[0] * 0.1;
          const verticalPadding = size[1] * 0.1;
          view.fit(viewMoveAction.value.polygon, {
            padding: [
              verticalPadding,
              horizontalPadding,
              verticalPadding,
              size[0] * (1 - fractionOfMapToUse) + horizontalPadding,
            ],
            maxZoom: 18,
          });
          break;
        }
      }
      const newCenter = view.getCenter();
      const newZoom = view.getZoom();
      if (oldCenter) {
        view.setCenter(oldCenter);
      }
      if (oldZoom) {
        view.setZoom(oldZoom);
      }
      window.requestAnimationFrame(() => {
        view.animate({ zoom: newZoom, center: newCenter, duration: 600 });
      });
    }
  }
};

const findExtentFromPoints = (coords: NEA.NonEmptyArray<Coordinate>): Extent.Extent =>
  pipe(
    coords,
    A.reduce(
      { minX: Number.MAX_VALUE, maxX: Number.MIN_VALUE, minY: Number.MAX_VALUE, maxY: Number.MIN_VALUE },
      (acc, c) => ({
        minX: Math.min(acc.minX, c[0]),
        maxX: Math.max(acc.maxX, c[0]),
        minY: Math.min(acc.minY, c[1]),
        maxY: Math.max(acc.maxY, c[1]),
      }),
    ),
    ({ minX, maxX, minY, maxY }) => [minX, minY, maxX, maxY],
  );

const getSwissExtent = (): Extent.Extent => {
  const [minX, minY] = transform([2420000, 1030000], 'EPSG:2056', 'EPSG:3857');
  const [maxX, maxY] = transform([2900000, 1350000], 'EPSG:2056', 'EPSG:3857');
  return [minX, minY, maxX, maxY];
};

export const SWISS_EXTENT = getSwissExtent();
export const SWISS_CENTER = [
  (SWISS_EXTENT[2] - SWISS_EXTENT[0]) / 2 + SWISS_EXTENT[0],
  (SWISS_EXTENT[3] - SWISS_EXTENT[1]) / 2 + SWISS_EXTENT[1],
];
