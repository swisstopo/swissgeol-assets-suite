import { StudyGeometryType } from '@asset-sg/shared/v2';
import { Fill, Stroke, Style } from 'ol/style';
import { StyleFunction } from 'ol/style/Style';
import { CustomFeatureProperties } from '../custom-feature-properties.enum';
import { DEFAULT_LINE_WIDTHS, DEFAULT_STROKE_WIDTH, LAYER_Z_INDEX } from '../style-constants';
import { makeLineShape, makeSimpleCircle, makeTriangleShape } from '../utils';
import { LayerStyle } from './layer-style.type';

type LayerStyleByGeometry = LayerStyle<Style | Style[]>;

const overviewStylesGeometry: LayerStyleByGeometry = {
  point: {
    pointInstance: new Style({
      zIndex: LAYER_Z_INDEX.POINT,
      image: makeSimpleCircle('#14AFB8', '#13474E'),
    }),
    polygonInstance: new Style({
      zIndex: LAYER_Z_INDEX.POINT,
      image: makeTriangleShape('rgba(245, 158, 11, 1.0)', '#78350F'),
    }),
    lineInstance: new Style({
      zIndex: LAYER_Z_INDEX.POINT,
      image: makeLineShape('#3B82F6', '#1E3A8A'),
    }),
  },
  line: [
    new Style({
      stroke: new Stroke({
        color: '#1E3A8A',
        width: DEFAULT_LINE_WIDTHS.STROKE,
      }),
      zIndex: LAYER_Z_INDEX.LINE,
    }),
    new Style({
      stroke: new Stroke({
        color: '#3B82F6',
        width: DEFAULT_LINE_WIDTHS.FILL,
      }),
      zIndex: LAYER_Z_INDEX.LINE,
    }),
  ],
  polygon: new Style({
    fill: new Fill({ color: 'rgba(245, 158, 11, 0.2)' }),
    stroke: new Stroke({ color: '#78350F', width: DEFAULT_STROKE_WIDTH }),
    zIndex: LAYER_Z_INDEX.POLYGON,
  }),
};

export const styleFunctionByGeometry: StyleFunction = (feature) => {
  const geometry = feature.getGeometry();
  if (!geometry) {
    return new Style();
  }
  switch (geometry.getType()) {
    case 'Point': {
      const geomType = feature.get(CustomFeatureProperties.GeometryType) as StudyGeometryType;

      switch (geomType) {
        case 'Point':
          return overviewStylesGeometry.point.pointInstance;
        case 'Line':
          return overviewStylesGeometry.point.lineInstance;
        case 'Polygon':
          return overviewStylesGeometry.point.polygonInstance;
        default:
          return new Style();
      }
    }
    case 'LineString':
      return overviewStylesGeometry.line;
    case 'Polygon':
      return overviewStylesGeometry.polygon;
    default:
      return new Style();
  }
};
