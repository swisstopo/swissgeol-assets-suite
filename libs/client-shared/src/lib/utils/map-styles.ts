import { Circle, Fill, RegularShape, Stroke, Style } from 'ol/style';

/**
 * These styles are used in the non-filtered overview and they consist of point
 * representations (location _or_ centroid)
 */
interface OverviewStyles {
  studyOverviewPoint: Style;
  studyOverviewPolygon: Style;
  studyOverviewLine: Style;
}

/**
 * These styles are used for the filtered view; i.e. they also style the
 * geometries and not just points.
 */
interface FilteredStyles {
  filteredPoint: Style;
  filteredPolygon: Style;
  filteredLine: Style[];
}

/**
 * These styles are applied to interactions, which are _always_ the buffered
 * geometry and as such, a polygon.
 */
interface InteractionStyles {
  hoveredPolygon: Style;
  selectedPolygon: Style;
}

/**
 * Combined styles for visualizing features in read mode
 */
type FeatureStyles = OverviewStyles & FilteredStyles & InteractionStyles & { hidden: Style };

/**
 * Legacy styles used within the editor
 */
interface EditorStyles {
  bigPointAsset: Style;
  bigPointAssetHighlighted: Style;
  bigPointAssetNotSelected: Style;
  polygonAsset: Style;
  polygonAssetHighlighted: Style;
  polygonAssetNotSelected: Style;
  lineStringAsset: Style;
  lineStringAssetHighlighted: Style;
  lineStringAssetNotSelected: Style;
  linePreview: Style;
}

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

export const makeRhombusImage = (radius: number) =>
  new RegularShape({
    points: 4,
    radius,
    angle: 0,
    fill: new Fill({ color: 'rgba(245, 158, 11, 1.0)' }), // no transparency on rhombus
    stroke: new Stroke({ color: '#78350F', width: 2 }),
  });

export const makeLineShape = (radius: number) =>
  new RegularShape({
    fill: new Fill({ color: '#3B82F6' }),
    stroke: new Stroke({ color: '#1E3A8A', width: 2 }),
    radius: radius / Math.SQRT2,
    radius2: radius,
    points: 4,
    angle: 0,
    scale: [1, 0.5],
  });

const overviewStyles: OverviewStyles = {
  studyOverviewPoint: studyPoint,
  studyOverviewPolygon: new Style({
    zIndex: 1,
    image: makeRhombusImage(5),
  }),
  studyOverviewLine: new Style({
    zIndex: 2,
    image: makeLineShape(5),
  }),
};

const filteredStyles: FilteredStyles = {
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

const interactionStyles: InteractionStyles = {
  hoveredPolygon: new Style({
    zIndex: 999,
    stroke: new Stroke({ color: '#8B5CF6', width: 8 }),
  }),
  selectedPolygon: new Style({
    zIndex: 999,
    stroke: new Stroke({ color: '#EC4899', width: 8 }),
  }),
};

export const featureStyles: FeatureStyles = {
  hidden: new Style(undefined),
  ...overviewStyles,
  ...filteredStyles,
  ...interactionStyles,
};

export const editorStyles: EditorStyles = {
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
  polygonAsset: new Style({
    stroke: new Stroke({ color: 'red', width: 3 }),
    fill: new Fill({ color: '#ffffff88' }),
  }),
  polygonAssetHighlighted: new Style({
    stroke: new Stroke({ color: '#0b7285', width: 4 }),
    fill: new Fill({ color: '#eafc5288' }),
  }),
  polygonAssetNotSelected: new Style({
    stroke: new Stroke({ color: '#ff0000', width: 3, lineDash: [10, 10] }),
    fill: new Fill({ color: '#ffffff88' }),
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
  linePreview: new Style({
    stroke: new Stroke({ color: '#0b7285', width: 3, lineDash: [10, 10] }),
  }),
};
