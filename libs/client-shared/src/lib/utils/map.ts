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
import { Circle, Fill, RegularShape, Stroke, Style } from 'ol/style';

import proj4 from 'proj4';
import { isoWGSLat, isoWGSLng } from '../models';
import { WindowService } from '../services';

import { lv95ToWGS } from './wgs';

proj4.defs(
  'EPSG:2056',
  '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs'
);
register(proj4);

export const createFeaturesFromStudy = (
  study: Study,
  featureStyles: { point: Style | Style[]; polygon: Style | Style[]; lineString: Style | Style[] }
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
    { assetSgFeatureType: study.geom._tag }
  ),
});

export const createFeaturesFromStudies = (
  studies: Studies,
  featureStyles: { point: Style | Style[]; polygon: Style | Style[]; lineString: Style | Style[] }
) =>
  pipe(
    studies,
    A.map((s) => createFeaturesFromStudy(s, featureStyles))
  );

export const decorateFeature = (
  feature: Feature,
  attributes: { style: Style | Style[]; id: string | number },
  properties: Record<string, string | number> = {}
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

export const makeRhombusImage = (radius: number) =>
  new RegularShape({
    points: 4,
    radius,
    angle: 0,
    fill: new Fill({ color: 'rgba(245, 158, 11, 1.0)' }), // no transparency on rhombus
    stroke: new Stroke({ color: '#78350F', width: 2 }),
  });

const makeLineShape = () =>
  new RegularShape({
    fill: new Fill({ color: '#3B82F6' }),
    stroke: new Stroke({ color: '#1E3A8A', width: 2 }),
    radius: 10 / Math.SQRT2,
    radius2: 10,
    points: 4,
    angle: 0,
    scale: [1, 0.5],
  });

// Todo: z-index is off

/**
 * This style is used for displaying a point study; which is used for both overview and filtered view.
 */
const studyPoint = new Style({
  zIndex: 3,
  image: new Circle({
    radius: 8,
    fill: new Fill({ color: '#14AFB8' }),
    stroke: new Stroke({ color: '#13474E', width: 2 }),
  }),
});

/**
 * These styles are used in the non-filtered overview and they consist of point representations (location _or_ centroid)
 */
const overviewStyles = {
  studyOverviewPoint: studyPoint,
  studyOverviewPolygon: new Style({
    zIndex: 1,
    image: makeRhombusImage(5),
  }),
  studyOverviewLine: new Style({
    zIndex: 2,
    image: makeLineShape(),
  }),
};

/**
 * These styles are used for the filtered view; i.e. they also style the geometries and not just points.
 */
const filteredStyles = {
  filteredPoint: studyPoint,
  filteredPolygon: new Style({
    fill: new Fill({ color: 'rgba(245, 158, 11, 0.2)' }),
    stroke: new Stroke({ color: '#78350F', width: 2 }),
    zIndex: 1,
  }),
  filteredLine: [
    // border style (slightly thicker)
    new Style({
      stroke: new Stroke({
        color: '#1E3A8A',
        width: 10,
      }),
      zIndex: 2,
    }),
    // fill style
    new Style({
      stroke: new Stroke({
        color: '#3B82F6',
        width: 6,
      }),
      zIndex: 2,
    }),
  ],
};

/**
 * These styles are used for the selected asset
 */
const selectedStyles = {
  selectedPoint: [
    new Style({
      zIndex: 3,
      image: new Circle({
        radius: 16,
        fill: new Fill({ color: '#EC4899' }),
      }),
    }),
    studyPoint,
  ],
  selectedPolygon: new Style({
    zIndex: 1,
    stroke: new Stroke({ color: 'red', width: 3 }),
    fill: new Fill({ color: '#ffffff88' }),
  }),
  selectedLine: new Style({
    zIndex: 2,
    stroke: new Stroke({ color: 'red', width: 3 }),
  }),
};

/**
 * These styles are used when hovering an asset
 */
const hoveredStyles = {
  hoveredPoint: [
    new Style({
      zIndex: 3,
      image: new Circle({
        radius: 16,
        fill: new Fill({ color: '#8B5CF6' }),
      }),
    }),
    studyPoint,
  ],
  hoveredPolygon: new Style({
    zIndex: 1,
    stroke: new Stroke({ color: '#0b7285', width: 4 }),
    fill: new Fill({ color: '#eafc5288' }),
  }),
  hoveredLine: new Style({
    zIndex: 2,
    stroke: new Stroke({ color: '#0b7285', width: 4 }),
    fill: new Fill({ color: '#eafc5288' }),
  }),
};

/**
 * These styles are used when editing multi-geometry objects in the editor to highlight those that are NOT currently
 * being edited.
 */
const nonEditingStyles = {
  nonEditingPoint: [
    new Style({
      zIndex: 3,
      image: new Circle({
        radius: 16,
        stroke: new Stroke({ color: '#ff0000', width: 6, lineDash: [10, 5] }),
        fill: new Fill({ color: '#ffffff88' }),
      }),
    }),
    studyPoint,
  ],
  nonEditingPolygon: [
    new Style({
      zIndex: 1,
      stroke: new Stroke({ color: '#ff0000', width: 3, lineDash: [10, 10] }),
      fill: new Fill({ color: '#ffffff88' }),
    }),
  ],
  nonEditingLine: [
    new Style({
      zIndex: 2,
      stroke: new Stroke({ color: '#ff0000', width: 3, lineDash: [10, 10] }),
    }),
  ],
};

export const featureStyles = {
  hidden: new Style(undefined),
  ...overviewStyles,
  ...filteredStyles,
  ...selectedStyles,
  ...hoveredStyles,
  ...nonEditingStyles,
  linePreview: new Style({
    stroke: new Stroke({ color: '#0b7285', width: 3, lineDash: [10, 10] }),
  }),
};

export const zoomToStudies = (
  windowService: WindowService,
  olMap: Map,
  studies: Study[],
  fractionOfMapToUse: number
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
      })(a.geom)
    ),
    A.flatten,
    NEA.fromArray,
    O.map((a) =>
      a.length === 1
        ? { _tag: 'centerOn' as const, coord: a[0] }
        : { _tag: 'fit' as const, polygon: pipe(findExtentFromPoints(a), polygonFromExtent) }
    )
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
      })
    ),
    ({ minX, maxX, minY, maxY }) => [minX, minY, maxX, maxY]
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
