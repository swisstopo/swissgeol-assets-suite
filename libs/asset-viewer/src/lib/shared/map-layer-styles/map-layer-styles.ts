import { StyleFunction } from 'ol/style/Style';
import { styleFunctionByAccess } from './styles/access-based.map-layer-style';
import { styleFunctionByGeometry } from './styles/geometry-based.map-layer-style';

export type LayerStyleIdentification = 'geometry' | 'access';

// todo assets-300, assets-420: finalize interface to be used with styling; add translation keys in proper places
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
    name: 'Geometrie',
    styleFunction: styleFunctionByGeometry,
    styleItems: [
      {
        translationKey: 'Asset Punkt',
        iconKey: 'geometry-point',
      },
      {
        translationKey: 'Asset Linie',
        iconKey: 'geometry-line',
        generalizedIconKey: 'geometry-line-generalized',
      },
      {
        translationKey: 'Asset Fläche',
        iconKey: 'geometry-polygon',
        generalizedIconKey: 'geometry-polygon-generalized',
      },
    ],
  },
  access: {
    name: 'Freigabe',
    styleFunction: styleFunctionByAccess,
    styleItems: [
      {
        translationKey: 'Öffentlich',
        iconKey: 'access-public',
      },
      {
        translationKey: 'Intern',
        iconKey: 'access-internal',
      },
      {
        translationKey: 'gesperrt',
        iconKey: 'access-locked',
      },
    ],
  },
};

export const defaultLayerStyle: LayerStyleIdentification = 'geometry';
