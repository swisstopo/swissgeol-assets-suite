import { StudyGeometryType } from '@asset-sg/shared/v2';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style, { StyleFunction } from 'ol/style/Style';
import { DEFAULT_LINE_WIDTHS, DEFAULT_STROKE_WIDTH, LAYER_Z_INDEX } from '../style-constants';
import { makeLineShape, makeSimpleCircle, makeTriangleShape } from '../utils';
import { LayerStyle } from './layer-style.type';

type AccessTypeKey = {
  restricted: Style | Style[];
  internal: Style | Style[];
  public: Style | Style[];
};

type LayerStyleByAccess = LayerStyle<AccessTypeKey>;

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

const accessTypeMapping: { [key: number]: keyof AccessTypeKey } = {
  1: 'public',
  2: 'internal',
  3: 'restricted',
};
const overviewStylesAccess: LayerStyleByAccess = {
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

export const styleFunctionByAccess: StyleFunction = (feature) => {
  const geometry = feature.getGeometry();
  if (!geometry) return new Style();

  const accessType = feature.get('access_type') as 1 | 2 | 3;
  const accessStyles: keyof AccessTypeKey = accessTypeMapping[accessType];

  switch (geometry.getType()) {
    case 'Point': {
      const geomType = feature.get('geometry_type') as StudyGeometryType;
      const styleKey = (
        {
          Point: 'pointInstance',
          Line: 'lineInstance',
          Polygon: 'polygonInstance',
        } as { [key in StudyGeometryType]: keyof LayerStyleByAccess['point'] }
      )[geomType];
      return overviewStylesAccess.point[styleKey]?.[accessStyles] ?? new Style();
    }
    case 'LineString':
      return overviewStylesAccess.line[accessStyles] ?? new Style();
    case 'Polygon':
      return overviewStylesAccess.polygon[accessStyles] ?? new Style();
    default:
      return new Style();
  }
};
