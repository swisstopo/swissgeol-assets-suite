import { Expose, Type } from 'class-transformer';
import { Equals, IsEnum, IsNumber, IsObject, IsString, Matches, ValidateNested } from 'class-validator';
import { AssetId } from '../models/asset';
import {
  Coordinate,
  CreateGeometryData,
  DeleteGeometryData,
  Geometry,
  GeometryAccessType,
  GeometryDetail,
  GeometryId,
  GeometryMutationType,
  GeometryType,
  UpdateGeometryData,
} from '../models/geometry';
import { Schema } from './base/schema';

export class CoordinateSchema extends Schema implements Coordinate {
  @Expose()
  @IsNumber()
  x!: number;

  @Expose()
  @IsNumber()
  y!: number;
}

class GeometryDataSchema extends Schema {
  mutation!: GeometryMutationType;
}

export class CreateGeometryDataSchema extends GeometryDataSchema implements CreateGeometryData {
  @Equals(GeometryMutationType.Create)
  override mutation!: GeometryMutationType.Create;

  @IsEnum(GeometryType)
  type!: GeometryType;

  @IsString()
  text!: string;
}

export class UpdateGeometryDataSchema extends GeometryDataSchema implements UpdateGeometryData {
  @Equals(GeometryMutationType.Update)
  override mutation!: GeometryMutationType.Update;

  @IsString()
  @IsGeometryId()
  id!: GeometryId;

  @IsString()
  text!: string;
}

export class DeleteGeometryDataSchema extends GeometryDataSchema implements DeleteGeometryData {
  @Equals(GeometryMutationType.Delete)
  override mutation!: GeometryMutationType.Delete;

  @IsString()
  @IsGeometryId()
  id!: GeometryId;
}

export class GeometrySchema extends Schema implements Geometry {
  @IsGeometryId()
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

export class GeometryDetailSchema extends Schema implements GeometryDetail {
  @Expose()
  @IsGeometryId()
  id!: GeometryId;

  @Expose()
  @IsEnum(GeometryType)
  type!: GeometryType;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => CoordinateSchema)
  coordinates!: Coordinate[];
}

export function IsGeometryId(): PropertyDecorator {
  const decorateIsString = IsString();
  const decorateMatches = Matches(/^[alt]_\d+$/);
  return (target, propertyKey) => {
    decorateIsString(target, propertyKey);
    decorateMatches(target, propertyKey);
  };
}

export function GeometryDataType(): PropertyDecorator {
  return Type(() => GeometryDataSchema, {
    discriminator: {
      property: 'mutation',
      subTypes: [
        { name: GeometryMutationType.Create, value: CreateGeometryDataSchema },
        { name: GeometryMutationType.Update, value: UpdateGeometryDataSchema },
        { name: GeometryMutationType.Delete, value: DeleteGeometryDataSchema },
      ],
    },
    keepDiscriminatorProperty: true,
  });
}
