import { GeometryType } from '@asset-sg/shared/v2';
import { Fill, Stroke, Style } from 'ol/style';
import { StyleFunction } from 'ol/style/Style';
import { MapWorkflowStatus, RequestedChanges } from '../../../utils/workflow-status';
import { CustomFeatureProperties } from '../custom-feature-properties.enum';
import { DEFAULT_LINE_WIDTHS, DEFAULT_STROKE_WIDTH, LAYER_Z_INDEX } from '../style-constants';
import { makeLineShape, makeSimpleCircle, makeTriangleShape } from '../utils';
import { getGeometryToPointRepresentationMapping, LayerStyle } from './layer-style.type';

type LayerStyleByWorkflowStatus = LayerStyle<Style | Style[]>;

interface MapColor {
  fillColor: (opacity?: number) => string;
  strokeColor: string;
}

const makeColor = (r: number, g: number, b: number, strokeColor: string): MapColor => ({
  fillColor: (opacity = 1.0) => `rgba(${r}, ${g}, ${b}, ${opacity})`,
  strokeColor,
});

export const workflowStatusColors: Record<MapWorkflowStatus, MapColor> = {
  Draft: makeColor(172, 180, 189, '#131B22'),
  InReview: makeColor(245, 158, 11, '#78350F'),
  Reviewed: makeColor(20, 175, 184, '#13474E'),
  Published: makeColor(16, 185, 129, '#064E3B'),
  [RequestedChanges]: makeColor(229, 57, 64, '#801519'),
};

const makeStyles = ({ fillColor, strokeColor }: MapColor): LayerStyleByWorkflowStatus => ({
  point: {
    pointInstance: new Style({
      zIndex: LAYER_Z_INDEX.POINT,
      image: makeSimpleCircle(fillColor(), strokeColor),
    }),
    lineInstance: new Style({
      zIndex: LAYER_Z_INDEX.POINT,
      image: makeLineShape(fillColor(), strokeColor),
    }),
    polygonInstance: new Style({
      zIndex: LAYER_Z_INDEX.POINT,
      image: makeTriangleShape(fillColor(), strokeColor),
    }),
  },
  line: [
    new Style({
      stroke: new Stroke({ color: strokeColor, width: DEFAULT_LINE_WIDTHS.STROKE }),
      zIndex: LAYER_Z_INDEX.LINE,
    }),
    new Style({
      stroke: new Stroke({ color: fillColor(), width: DEFAULT_LINE_WIDTHS.FILL }),
      zIndex: LAYER_Z_INDEX.LINE,
    }),
  ],
  polygon: new Style({
    stroke: new Stroke({ color: strokeColor, width: DEFAULT_STROKE_WIDTH }),
    fill: new Fill({ color: fillColor(0.3) }),
    zIndex: LAYER_Z_INDEX.POLYGON,
  }),
});

const overviewStylesByWorkflowStatus = Object.fromEntries(
  Object.entries(workflowStatusColors).map(([status, color]) => [status, makeStyles(color)]),
) as Record<MapWorkflowStatus, LayerStyleByWorkflowStatus>;

export const styleFunctionByWorkflowStatus: StyleFunction = (feature) => {
  const geometry = feature.getGeometry();
  if (!geometry) {
    return new Style();
  }

  // Features without a category are not drawn in this mode.
  const status = feature.get(CustomFeatureProperties.WorkflowStatus) as MapWorkflowStatus | undefined;
  const styles = status == null ? undefined : overviewStylesByWorkflowStatus[status];
  if (styles == null) {
    return undefined;
  }

  switch (geometry.getType()) {
    case 'Point': {
      const geomType = feature.get(CustomFeatureProperties.GeometryType) as GeometryType;
      const styleKey = getGeometryToPointRepresentationMapping()[geomType];
      return styleKey == null ? new Style() : styles.point[styleKey];
    }
    case 'LineString':
      return styles.line;
    case 'Polygon':
      return styles.polygon;
    default:
      return new Style();
  }
};
