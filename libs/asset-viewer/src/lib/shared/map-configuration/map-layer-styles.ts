import { StyleFunction } from 'ol/style/Style';
import { styleFunctionByAccess } from './styles/access-based.map-layer-style';
import { styleFunctionByGeometry } from './styles/geometry-based.map-layer-style';

export type LayerStyleIdentification = 'geometry' | 'access';

/**
 * A LayerStyle consists of a translatable name, an OpenLayers style function that is responsible for styling the
 * data, as well as a list of LayerStyleItems which are used to display the legend.
 */
export interface LayerStyle {
  name: string;
  styleItems: LayerStyleItem[];
  styleFunction: StyleFunction;
}

/**
 * A symbolization used in the LayerStyle's style function; this entry is used to display the legend.
 */
interface LayerStyleItem {
  translationKey: string;
  iconKey: string;
  /**
   * This key is used for the filtered view to show a different icon since the
   * geometries are generalized to points there.
   */
  generalizedIconKey?: string;
}

type AvailableLayerStyles = {
  [K in LayerStyleIdentification]: LayerStyle;
};

export const availableLayerStyles: AvailableLayerStyles = {
  geometry: {
    name: 'mapLayers.geometry.name',
    styleFunction: styleFunctionByGeometry,
    styleItems: [
      {
        translationKey: 'mapLayers.geometry.items.point',
        iconKey: 'geometry-point',
      },
      {
        translationKey: 'mapLayers.geometry.items.line',
        iconKey: 'geometry-line',
        generalizedIconKey: 'geometry-line-generalized',
      },
      {
        translationKey: 'mapLayers.geometry.items.polygon',
        iconKey: 'geometry-polygon',
        generalizedIconKey: 'geometry-polygon-generalized',
      },
    ],
  },
  access: {
    name: 'mapLayers.access.name',
    styleFunction: styleFunctionByAccess,
    styleItems: [
      {
        translationKey: 'mapLayers.access.items.public',
        iconKey: 'access-public',
      },
      {
        translationKey: 'mapLayers.access.items.internal',
        iconKey: 'access-internal',
      },
      {
        translationKey: 'mapLayers.access.items.restricted',
        iconKey: 'access-locked',
      },
    ],
  },
};

export const defaultLayerStyle: LayerStyleIdentification = 'geometry';
