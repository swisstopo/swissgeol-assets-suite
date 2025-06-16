import { AssetId } from './asset';

export interface Geometry {
  id: GeometryId;
  type: GeometryType;
  accessType: GeometryAccessType;
  center: Coordinate;
  assetId: AssetId;
}

export interface Coordinate {
  x: number;
  y: number;
}

export interface GeometryData {
  type: GeometryType;
  geometry: string;
}

export interface GeometryUpdate extends GeometryData {
  id: GeometryId;
}

export enum GeometryType {
  Point = 'Point',
  Line = 'Line',
  Polygon = 'Polygon',
}

export enum GeometryAccessType {
  Public,
  Internal,
}

export type GeometryId = `study_${StudyType}_${number}`;

export enum StudyType {
  Area = 'area',
  Location = 'location',
  Trace = 'trace',
}

export const mapGeometryTypeToStudyType = (type: GeometryType): StudyType => {
  switch (type) {
    case GeometryType.Point:
      return StudyType.Location;
    case GeometryType.Line:
      return StudyType.Trace;
    case GeometryType.Polygon:
      return StudyType.Area;
  }
};

export const serializeGeometryAsCsv = (geometry: Geometry): string => {
  return `${geometry.id.substring(6)};${geometry.assetId};${geometry.type};${geometry.accessType};${geometry.center.x};${geometry.center.y}`;
};
