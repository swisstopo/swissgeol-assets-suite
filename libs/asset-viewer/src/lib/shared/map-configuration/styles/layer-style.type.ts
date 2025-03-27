import { StudyGeometryType } from '@asset-sg/shared/v2';

export type LayerStyle<T> = {
  point: {
    pointInstance: T;
    lineInstance: T;
    polygonInstance: T;
  };
  line: T;
  polygon: T;
};

/**
 * Lookup table for mapping geometry type to the corresponding point representation.
 */
export const getGeometryToPointRepresentationMapping: <T>() => {
  [key in StudyGeometryType]: keyof LayerStyle<T>['point'];
} = () => ({
  Point: 'pointInstance',
  Line: 'lineInstance',
  Polygon: 'polygonInstance',
});
