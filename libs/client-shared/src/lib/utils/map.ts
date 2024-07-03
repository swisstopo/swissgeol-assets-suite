import { isNotNil } from '@asset-sg/core';
import { Geom, LV95, Studies, Study } from '@asset-sg/shared';
import * as A from 'fp-ts/Array';
import { pipe } from 'fp-ts/function';
import * as NEA from 'fp-ts/NonEmptyArray';
import * as O from 'fp-ts/Option';
import { Coordinate } from 'ol/coordinate';
import { easeOut } from 'ol/easing';
import { Extent } from 'ol/extent';
import Feature from 'ol/Feature';
import { LineString, Point, Polygon, SimpleGeometry } from 'ol/geom';
import { fromExtent as polygonFromExtent } from 'ol/geom/Polygon';
import Map from 'ol/Map';
import { fromLonLat } from 'ol/proj';
import { Circle, Fill, Icon, RegularShape, Stroke, Style } from 'ol/style';
import View from 'ol/View';

import { isoWGSLat, isoWGSLng } from '../models';
import { WindowService } from '../services';

import { lv95ToWGS } from './wgs';

export const createFeaturesFromStudy = (
  study: Study,
  featureStyles: { point: Style; polygon: Style; lineString: Style }
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
  featureStyles: { point: Style; polygon: Style; lineString: Style }
) =>
  pipe(
    studies,
    A.map((s) => createFeaturesFromStudy(s, featureStyles))
  );

export const decorateFeature = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feature: Feature,
  attributes: { style: Style; id: string | number },
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
    fill: new Fill({ color: '#194ed0' }),
    stroke: new Stroke({ color: '#194ed0' }),
  });

export const featureStyles = {
  hidden: new Style(undefined),
  point: new Style({
    image: new Circle({
      radius: 10,
      fill: new Fill({ color: '#194ed0' }),
      stroke: new Stroke({ color: '#194ed0' }),
    }),
  }),
  rhombus: new Style({
    image: makeRhombusImage(5),
  }),
  bigPoint: new Style({
    image: new Circle({
      radius: 20,
      stroke: new Stroke({ color: 'red', width: 2.5 }),
      fill: new Fill({ color: 'transparent' }),
    }),
    zIndex: 3,
  }),
  bigPointAsset: new Style({
    image: new Circle({
      radius: 20,
      stroke: new Stroke({ color: 'red', width: 6 }),
      fill: new Fill({ color: '#ffffff88' }),
    }),
  }),
  bigPointAssetHighlighted: new Style({
    image: new Circle({
      radius: 20,
      stroke: new Stroke({ color: '#0b7285', width: 6 }),
      fill: new Fill({ color: '#eafc5288' }),
    }),
  }),
  bigPointAssetNotSelected: new Style({
    image: new Circle({
      radius: 20,
      stroke: new Stroke({ color: '#ff0000', width: 6, lineDash: [10, 5] }),
      fill: new Fill({ color: '#ffffff88' }),
    }),
  }),

  polygon: new Style({
    stroke: new Stroke({ color: 'red', width: 2.5 }),
    fill: new Fill({ color: 'transparent' }),
    zIndex: 1,
  }),
  polygonAsset: new Style({
    stroke: new Stroke({ color: 'red', width: 3 }),
    fill: new Fill({ color: '#ffffff88' }),
  }),
  linePreview: new Style({
    stroke: new Stroke({ color: '#0b7285', width: 3, lineDash: [10, 10] }),
  }),
  polygonAssetHighlighted: new Style({
    stroke: new Stroke({ color: '#0b7285', width: 4 }),
    fill: new Fill({ color: '#eafc5288' }),
  }),
  polygonAssetNotSelected: new Style({
    stroke: new Stroke({ color: '#ff0000', width: 3, lineDash: [10, 10] }),
    fill: new Fill({ color: '#ffffff88' }),
  }),

  lineString: new Style({
    stroke: new Stroke({ color: 'red', width: 3 }),
    fill: new Fill({ color: 'transparent' }),
    zIndex: 2,
  }),
  lineStringAsset: new Style({
    stroke: new Stroke({ color: 'red', width: 3 }),
  }),
  lineStringAssetHighlighted: new Style({
    stroke: new Stroke({ color: '#0b7285', width: 4 }),
    fill: new Fill({ color: '#eafc5288' }),
  }),
  lineStringAssetNotSelected: new Style({
    stroke: new Stroke({ color: '#ff0000', width: 3, lineDash: [10, 10] }),
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
      oldCenter && view.setCenter(oldCenter);
      oldZoom && view.setZoom(oldZoom);
      window.requestAnimationFrame(() => {
        view.animate({ zoom: newZoom, center: newCenter, duration: 600 });
      });
    }
  }
};

const findExtentFromPoints = (coords: NEA.NonEmptyArray<Coordinate>): Extent =>
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

export const fitToSwitzerland = (view: View, withAnimation: boolean) => {
  view.fit(
    new Polygon([
      [
        [662739.4642028128, 6075958.039112476],
        [658764.7387319836, 5748807.558051921],
        [1176090.5461660565, 5747278.817486218],
        [1172115.8206952275, 6079321.268357024],
        [662739.4642028128, 6075958.039112476],
      ],
    ]),
    withAnimation ? { duration: 250, easing: easeOut } : {}
  );
};
