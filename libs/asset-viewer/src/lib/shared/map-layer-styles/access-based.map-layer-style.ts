import { StudyGeometryType } from '@asset-sg/shared/v2';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style, { StyleFunction } from 'ol/style/Style';
import { LayerStyle } from './layer-style.type';
import { DEFAULT_LINE_WIDTHS, DEFAULT_STROKE_WIDTH, LAYER_Z_INDEX } from './style-constants';
import { makeLineShape, makeSimpleCircle, makeTriangleShape } from './utils';

const publicAccess = {
  fillColor: (opactityOverride = 1.0) => `rgba(16, 185, 129, ${opactityOverride})`,
  strokeColor: '#064E3B',
};
const internalAccess = {
  fillColor: (opacityOverride = 1.0) => `rgba(245, 158, 11, ${opacityOverride})`,
  strokeColor: '#78350F',
};
const restrictedAccess = {
  fillColor: (opacityOverride = 1.0) => `rgba(229, 57, 64, ${opacityOverride})`,
  strokeColor: '#801519',
};
type AccessStyle = LayerStyle<{
  restricted: Style | Style[];
  internal: Style | Style[];
  public: Style | Style[];
}>;

const overviewStylesAccess: AccessStyle = {
  point: {
    pointInstance: {
      public: new Style({
        zIndex: LAYER_Z_INDEX.POINT,
        image: makeSimpleCircle(publicAccess.fillColor(), publicAccess.strokeColor),
      }),
      internal: new Style({
        zIndex: LAYER_Z_INDEX.POINT,
        image: makeSimpleCircle(internalAccess.fillColor(), internalAccess.strokeColor),
      }),
      restricted: new Style({
        zIndex: LAYER_Z_INDEX.POINT,
        image: makeSimpleCircle(restrictedAccess.fillColor(), restrictedAccess.strokeColor),
      }),
    },
    lineInstance: {
      public: new Style({
        zIndex: LAYER_Z_INDEX.POINT,
        image: makeLineShape(publicAccess.fillColor(), publicAccess.strokeColor),
      }),
      internal: new Style({
        zIndex: LAYER_Z_INDEX.POINT,
        image: makeLineShape(internalAccess.fillColor(), internalAccess.strokeColor),
      }),
      restricted: new Style({
        zIndex: LAYER_Z_INDEX.POINT,
        image: makeLineShape(restrictedAccess.fillColor(), restrictedAccess.strokeColor),
      }),
    },
    polygonInstance: {
      public: new Style({
        zIndex: LAYER_Z_INDEX.POINT,
        image: makeTriangleShape(publicAccess.fillColor(), publicAccess.strokeColor),
      }),
      internal: new Style({
        zIndex: LAYER_Z_INDEX.POINT,
        image: makeTriangleShape(internalAccess.fillColor(), internalAccess.strokeColor),
      }),
      restricted: new Style({
        zIndex: LAYER_Z_INDEX.POINT,
        image: makeTriangleShape(restrictedAccess.fillColor(), restrictedAccess.strokeColor),
      }),
    },
  },
  line: {
    public: [
      new Style({
        stroke: new Stroke({
          color: publicAccess.strokeColor,
          width: DEFAULT_LINE_WIDTHS.STROKE,
        }),
        zIndex: LAYER_Z_INDEX.LINE,
      }),
      new Style({
        stroke: new Stroke({
          color: publicAccess.fillColor(),
          width: DEFAULT_LINE_WIDTHS.FILL,
        }),
        zIndex: LAYER_Z_INDEX.LINE,
      }),
    ],
    internal: [
      new Style({
        stroke: new Stroke({
          color: internalAccess.strokeColor,
          width: DEFAULT_LINE_WIDTHS.STROKE,
        }),
        zIndex: LAYER_Z_INDEX.LINE,
      }),
      new Style({
        stroke: new Stroke({
          color: internalAccess.fillColor(),
          width: DEFAULT_LINE_WIDTHS.FILL,
        }),
        zIndex: LAYER_Z_INDEX.LINE,
      }),
    ],
    restricted: [
      new Style({
        stroke: new Stroke({
          color: restrictedAccess.strokeColor,
          width: DEFAULT_LINE_WIDTHS.STROKE,
        }),
        zIndex: LAYER_Z_INDEX.LINE,
      }),
      new Style({
        stroke: new Stroke({
          color: restrictedAccess.fillColor(),
          width: DEFAULT_LINE_WIDTHS.FILL,
        }),
        zIndex: LAYER_Z_INDEX.LINE,
      }),
    ],
  },
  polygon: {
    public: new Style({
      stroke: new Stroke({ color: publicAccess.strokeColor, width: DEFAULT_STROKE_WIDTH }),
      fill: new Fill({ color: publicAccess.fillColor(0.3) }),
      zIndex: LAYER_Z_INDEX.POLYGON,
    }),
    internal: new Style({
      stroke: new Stroke({ color: internalAccess.strokeColor, width: DEFAULT_STROKE_WIDTH }),
      fill: new Fill({ color: internalAccess.fillColor(0.3) }),
      zIndex: LAYER_Z_INDEX.POLYGON,
    }),
    restricted: new Style({
      stroke: new Stroke({ color: restrictedAccess.strokeColor, width: DEFAULT_STROKE_WIDTH }),
      fill: new Fill({ color: restrictedAccess.fillColor(0.3) }),
      zIndex: LAYER_Z_INDEX.POLYGON,
    }),
  },
};

export const accessStyleFunction: StyleFunction = (feature) => {
  const geometry = feature.getGeometry();
  if (geometry) {
    switch (geometry.getType()) {
      case 'Point':
        {
          const geomType = feature.get('geometry_type') as StudyGeometryType;
          let style: keyof AccessStyle['point'];
          switch (geomType) {
            case 'Point':
              style = 'pointInstance';
              break;
            case 'Line':
              style = 'lineInstance';
              break;
            case 'Polygon':
              style = 'polygonInstance';
              break;
          }
          const accessType = feature.get('access_type') as 1 | 2 | 3;
          switch (accessType) {
            case 1:
              return overviewStylesAccess.point[style].public;
            case 2:
              return overviewStylesAccess.point[style].internal;
            case 3:
              return overviewStylesAccess.point[style].restricted;
          }
        }
        break; // todo required?
      case 'LineString':
        {
          const accessType = feature.get('access_type') as 1 | 2 | 3;
          switch (accessType) {
            case 1:
              return overviewStylesAccess.line.public;
            case 2:
              return overviewStylesAccess.line.internal;
            case 3:
              return overviewStylesAccess.line.restricted;
          }
        }
        break;
      case 'Polygon': {
        const accessType = feature.get('access_type') as 1 | 2 | 3;
        switch (accessType) {
          case 1:
            return overviewStylesAccess.polygon.public;
          case 2:
            return overviewStylesAccess.polygon.internal;
          case 3:
            return overviewStylesAccess.polygon.restricted;
        }
      }
    }
  }
  return new Style();
};
