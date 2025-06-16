import { Transform, Type } from 'class-transformer';
import { IsNumber, IsEnum, IsObject, IsString, Matches, ValidateNested } from 'class-validator';
import { AssetId } from '../models/asset';
import {
  Coordinate,
  Geometry,
  GeometryAccessType,
  GeometryData,
  GeometryId,
  GeometryType,
  GeometryUpdate,
} from '../models/geometry';
import { Schema } from './base/schema';

export class CoordinateSchema extends Schema implements Coordinate {
  @IsNumber()
  x!: number;

  @IsNumber()
  y!: number;
}

export class GeometryDataSchema extends Schema implements GeometryData {
  @IsEnum(GeometryType)
  type!: GeometryType;

  @IsString()
  geometry!: string;
}

export class GeometryUpdateSchema extends GeometryDataSchema implements GeometryUpdate {
  @IsString()
  @Matches(/^study_(?:area|location|trace)_\d+$/)
  id!: GeometryId;
}

export class GeometrySchema extends Schema implements Geometry {
  @IsString()
  @Matches(/^study_(?:area|location|trace)_\d+$/)
  id!: GeometryId;

  @IsEnum(GeometryType)
  type!: GeometryType;

  @IsEnum(GeometryAccessType)
  accessType!: GeometryAccessType;

  @IsObject()
  @ValidateNested()
  @Type(() => CoordinateSchema)
  center!: Coordinate;
  assetId!: AssetId;
}

export function TransformGeometryData(options: { each?: boolean } = {}) {
  const transformSingle = (value: object) => {
    if ('id' in value) {
      return Object.assign(new GeometryUpdateSchema(), value);
    } else {
      return Object.assign(new GeometryDataSchema(), value);
    }
  };
  return options.each
    ? Transform(({ value }) => (value as object[]).map(transformSingle))
    : Transform(({ value }) => transformSingle(value));
}
