import { Type } from 'class-transformer';
import { IsNumber, IsEnum, IsObject, IsString, Matches, ValidateNested, Equals } from 'class-validator';
import { AssetId } from '../models/asset';
import {
  Coordinate,
  CreateGeometryData,
  DeleteGeometryData,
  Geometry,
  GeometryAccessType,
  GeometryId,
  GeometryMutationType,
  GeometryType,
  UpdateGeometryData,
} from '../models/geometry';
import { Schema } from './base/schema';

export class CoordinateSchema extends Schema implements Coordinate {
  @IsNumber()
  x!: number;

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
  @Matches(/^study_(?:area|location|trace)_\d+$/)
  id!: GeometryId;

  @IsEnum(GeometryType)
  type!: GeometryType;

  @IsString()
  text!: string;
}

export class DeleteGeometryDataSchema extends GeometryDataSchema implements DeleteGeometryData {
  @Equals(GeometryMutationType.Delete)
  override mutation!: GeometryMutationType.Delete;

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
