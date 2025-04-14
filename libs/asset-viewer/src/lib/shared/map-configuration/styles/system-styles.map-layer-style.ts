import { Stroke, Style } from 'ol/style';

/**
 * These styles are applied to interactions, which are _always_ the buffered
 * geometry and as such, a polygon.
 */
interface InteractionStyles {
  hoveredPolygon: Style;
  selectedPolygon: Style;
}

export const interactionStyles: InteractionStyles = {
  hoveredPolygon: new Style({
    zIndex: 999,
    stroke: new Stroke({ color: '#8B5CF6', width: 8 }),
  }),
  selectedPolygon: new Style({
    zIndex: 999,
    stroke: new Stroke({ color: '#EC4899', width: 8 }),
  }),
};
