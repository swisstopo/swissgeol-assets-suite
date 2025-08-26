import { AssetId } from './asset';

export interface Geometry {
  id: GeometryId;
  type: GeometryType;
  accessType: GeometryAccessType;
  center: Coordinate;
  assetId: AssetId;
}

export interface GeometryDetail {
  id: GeometryId;
  type: GeometryType;
  coordinates: Coordinate[];
}

export interface Coordinate {
  x: number;
  y: number;
}

export enum GeometryMutationType {
  Create = 'Create',
  Update = 'Update',
  Delete = 'Delete',
}

export type GeometryData = CreateGeometryData | UpdateGeometryData | DeleteGeometryData;

export interface CreateGeometryData {
  mutation: GeometryMutationType.Create;
  type: GeometryType;
  text: string;
}

export interface UpdateGeometryData {
  mutation: GeometryMutationType.Update;
  id: GeometryId;
  text: string;
}

export interface DeleteGeometryData {
  mutation: GeometryMutationType.Delete;
  id: GeometryId;
}

export enum GeometryType {
  Point = 'Point',
  LineString = 'LineString',
  Polygon = 'Polygon',
}

export enum GeometryAccessType {
  Public,
  Internal,
}

type GeometryIdentifier = 'a' | 'l' | 't'; // area, location, trace
export type GeometryId = `${GeometryIdentifier}_${number}`;

export enum StudyType {
  Area = 'area',
  Location = 'location',
  Trace = 'trace',
}

export const mapGeometryTypeToStudyType = (type: GeometryType): StudyType => {
  switch (type) {
    case GeometryType.Point:
      return StudyType.Location;
    case GeometryType.LineString:
      return StudyType.Trace;
    case GeometryType.Polygon:
      return StudyType.Area;
  }
};

export const extractGeometryTypeFromId = (id: GeometryId): GeometryType => {
  const [studyType, _suffix] = id.split('_', 2);
  switch (studyType as GeometryIdentifier) {
    case 'l':
      return GeometryType.Point;
    case 't':
      return GeometryType.LineString;
    case 'a':
      return GeometryType.Polygon;
    default:
      throw new Error(`Invalid geometry id: ${id}`);
  }
};

export const serializeGeometryAsCsv = (geometry: Geometry): string => {
  // todo: the double ; is because I could not be bothered to fix the parsing; Geometry type is used in multiple sources.
  return `${geometry.id};${geometry.assetId};;${geometry.accessType};${geometry.center.x};${geometry.center.y}`;
};

export const parseGeometryIdNumber = (id: GeometryId): number => {
  const match = /^[alt]_(\d+)$/.exec(id);
  if (match === null) {
    throw new Error(`Invalid studyId: ${id}`);
  }
  return parseInt(match[1]);
};
