import { StudyAccessType, StudyGeometryType } from '@asset-sg/shared/v2';
import { FeatureLike } from 'ol/Feature';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style, { StyleFunction } from 'ol/style/Style';
import { CustomFeatureProperties } from '../custom-feature-properties.enum';
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

const accessTypeMapping: { [key in StudyAccessType]: keyof AccessTypeKey } = {
  0: 'public',
  1: 'internal',
  2: 'restricted',
};

/**
 * Used to extract the point representation for a given geometry from the layer style.
 */
const geometryToPointRepresentationMapping: { [key in StudyGeometryType]: keyof LayerStyleByAccess['point'] } = {
  Point: 'pointInstance',
  Line: 'lineInstance',
  Polygon: 'polygonInstance',
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

/**
 * Returns the point representation for a given geometry and access type by using the lookup table and extracting the
 * corresponding point.
 * @param feature
 * @param accessStyles
 */
const getPointRepresentationForGeometry = (
  feature: FeatureLike,
  accessStyles: keyof AccessTypeKey
): Style | Style[] => {
  const geomType = feature.get(CustomFeatureProperties.GeometryType) as StudyGeometryType;
  const styleKey = geometryToPointRepresentationMapping[geomType];
  return overviewStylesAccess.point[styleKey][accessStyles];
};

export const styleFunctionByAccess: StyleFunction = (feature) => {
  const geometry = feature.getGeometry();
  if (!geometry) {
    return new Style();
  }

  const accessType = feature.get(CustomFeatureProperties.AccessType) as StudyAccessType;
  const accessStyles: keyof AccessTypeKey = accessTypeMapping[accessType];
  switch (geometry.getType()) {
    case 'Point': {
      return getPointRepresentationForGeometry(feature, accessStyles);
    }
    case 'LineString':
      return overviewStylesAccess.line[accessStyles];
    case 'Polygon':
      return overviewStylesAccess.polygon[accessStyles];
    default:
      return new Style();
  }
};
