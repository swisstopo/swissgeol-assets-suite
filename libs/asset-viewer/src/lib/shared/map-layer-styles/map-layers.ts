import { StyleFunction } from 'ol/style/Style';
import { accessStyleFunction } from './access-based.map-layer-style';
import { geometryStyleFunction } from './geometry-based.map-layer-style';

export type LayerType = 'geometry' | 'access';

// todo assets-300, assets-420: finalize interface to be used with styling; add translation keys in proper places
export interface MapStyle {
  name: string;
  type: LayerType;
  styleItems: MapStyleItem[];
  styleFunction: StyleFunction;
}

interface MapStyleItem {
  translationKey: string;
  iconKey: string;
  /**
   * This key is used for the filtered view to show a different icon since the
   * geometries are generalized to points there.
   */
  generalizedIconKey?: string;
}

export const mapLayers: MapStyle[] = [
  {
    name: 'Geometrie',
    type: 'geometry',
    styleFunction: geometryStyleFunction,
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
  {
    name: 'Freigabe',
    type: 'access',
    styleFunction: accessStyleFunction,
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
];
