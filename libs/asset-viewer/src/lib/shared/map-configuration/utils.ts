import { Circle, Fill, RegularShape, Stroke } from 'ol/style';
import { DEFAULT_POINT_RADIUS, DEFAULT_STROKE_WIDTH } from './style-constants';

export const makeTriangleShape = (fillColor: string, strokeColor: string) =>
  new RegularShape({
    points: 3,
    radius: DEFAULT_POINT_RADIUS.TRIANGLE,
    angle: 0,
    fill: new Fill({ color: fillColor }), // no transparency on rhombus
    stroke: new Stroke({ color: strokeColor, width: DEFAULT_STROKE_WIDTH }),
  });

export const makeLineShape = (fillColor: string, strokeColor: string) =>
  new RegularShape({
    fill: new Fill({ color: fillColor }),
    stroke: new Stroke({ color: strokeColor, width: DEFAULT_STROKE_WIDTH }),
    radius: DEFAULT_POINT_RADIUS.RECTANGLE / Math.SQRT2,
    radius2: DEFAULT_POINT_RADIUS.RECTANGLE,
    points: 4,
    angle: 0,
    scale: [1, 0.5],
  });

export const makeSimpleCircle = (fillColor: string, strokeColor: string) => {
  return new Circle({
    radius: DEFAULT_POINT_RADIUS.CIRCLE,
    fill: new Fill({ color: fillColor }),
    stroke: new Stroke({ color: strokeColor, width: DEFAULT_STROKE_WIDTH }),
  });
};
