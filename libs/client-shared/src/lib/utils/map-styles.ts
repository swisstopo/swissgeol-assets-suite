import { Circle, Fill, Stroke, Style } from 'ol/style';

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
