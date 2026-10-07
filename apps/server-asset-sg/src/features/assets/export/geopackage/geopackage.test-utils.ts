import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Envelope, WkbGeometryType } from '@/features/assets/export/geopackage/geopackage-geometry';

export type Coordinate = [number, number];

export type ParsedGeometry =
  | { type: WkbGeometryType.Point; coordinates: Coordinate }
  | { type: WkbGeometryType.LineString; coordinates: Coordinate[] }
  | { type: WkbGeometryType.Polygon; coordinates: Coordinate[][] }
  | { type: WkbGeometryType.MultiLineString; coordinates: Coordinate[][] }
  | { type: WkbGeometryType.MultiPolygon; coordinates: Coordinate[][][] };

export interface DecodedGeoPackageGeometry {
  version: number;
  flags: number;
  srsId: number;
  envelope: Envelope | null;
  geometry: ParsedGeometry;
}

class WkbWriter {
  private readonly chunks: Buffer[] = [];

  header(type: WkbGeometryType): this {
    const buffer = Buffer.alloc(5);
    buffer.writeUInt8(1, 0);
    buffer.writeUInt32LE(type, 1);
    this.chunks.push(buffer);
    return this;
  }

  count(value: number): this {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32LE(value, 0);
    this.chunks.push(buffer);
    return this;
  }

  coordinates(coordinates: Coordinate[]): this {
    this.count(coordinates.length);
    coordinates.forEach((coordinate) => this.coordinate(coordinate));
    return this;
  }

  coordinate([x, y]: Coordinate): this {
    const buffer = Buffer.alloc(16);
    buffer.writeDoubleLE(x, 0);
    buffer.writeDoubleLE(y, 8);
    this.chunks.push(buffer);
    return this;
  }

  build(): Buffer {
    return Buffer.concat(this.chunks);
  }
}

export const wkbPoint = (coordinate: Coordinate): Buffer =>
  new WkbWriter().header(WkbGeometryType.Point).coordinate(coordinate).build();

export const wkbMultiLineString = (lines: Coordinate[][]): Buffer => {
  const writer = new WkbWriter().header(WkbGeometryType.MultiLineString).count(lines.length);
  lines.forEach((line) => writer.header(WkbGeometryType.LineString).coordinates(line));
  return writer.build();
};

export const wkbMultiPolygon = (polygons: Coordinate[][][]): Buffer => {
  const writer = new WkbWriter().header(WkbGeometryType.MultiPolygon).count(polygons.length);
  polygons.forEach((rings) => {
    writer.header(WkbGeometryType.Polygon).count(rings.length);
    rings.forEach((ring) => writer.coordinates(ring));
  });
  return writer.build();
};

export const envelopeOf = (coordinates: Coordinate[]): Envelope => ({
  minX: Math.min(...coordinates.map(([x]) => x)),
  maxX: Math.max(...coordinates.map(([x]) => x)),
  minY: Math.min(...coordinates.map(([, y]) => y)),
  maxY: Math.max(...coordinates.map(([, y]) => y)),
});

/**
 * Parses a little- or big-endian 2D WKB geometry.
 */
export const parseWkb = (wkb: Uint8Array): ParsedGeometry => {
  const view = new DataView(wkb.buffer, wkb.byteOffset, wkb.byteLength);
  let offset = 0;
  let isLittleEndian = true;

  const readHeader = (): number => {
    isLittleEndian = view.getUint8(offset) === 1;
    const type = view.getUint32(offset + 1, isLittleEndian);
    offset += 5;
    return type;
  };
  const readCount = (): number => {
    const value = view.getUint32(offset, isLittleEndian);
    offset += 4;
    return value;
  };
  const readCoordinate = (): Coordinate => {
    const coordinate: Coordinate = [
      view.getFloat64(offset, isLittleEndian),
      view.getFloat64(offset + 8, isLittleEndian),
    ];
    offset += 16;
    return coordinate;
  };
  const readCoordinates = (): Coordinate[] => Array.from({ length: readCount() }, readCoordinate);
  const readRings = (): Coordinate[][] => Array.from({ length: readCount() }, readCoordinates);
  const expectHeader = (expected: WkbGeometryType): void => {
    const type = readHeader();
    if (type !== expected) {
      throw new Error(`expected WKB type ${expected}, got ${type}`);
    }
  };

  const type = readHeader();
  switch (type) {
    case WkbGeometryType.Point:
      return { type, coordinates: readCoordinate() };
    case WkbGeometryType.LineString:
      return { type, coordinates: readCoordinates() };
    case WkbGeometryType.Polygon:
      return { type, coordinates: readRings() };
    case WkbGeometryType.MultiLineString:
      return {
        type,
        coordinates: Array.from({ length: readCount() }, () => {
          expectHeader(WkbGeometryType.LineString);
          return readCoordinates();
        }),
      };
    case WkbGeometryType.MultiPolygon:
      return {
        type,
        coordinates: Array.from({ length: readCount() }, () => {
          expectHeader(WkbGeometryType.Polygon);
          return readRings();
        }),
      };
    default:
      throw new Error(`unsupported WKB type ${type}`);
  }
};

export const decodeGeoPackageGeometry = (blob: Uint8Array): DecodedGeoPackageGeometry => {
  const buffer = Buffer.from(blob.buffer, blob.byteOffset, blob.byteLength);
  if (buffer.toString('ascii', 0, 2) !== 'GP') {
    throw new Error('missing GeoPackage magic');
  }
  const flags = buffer.readUInt8(3);
  const isLittleEndian = (flags & 0b1) === 1;
  const envelopeType = (flags >> 1) & 0b111;
  const srsId = isLittleEndian ? buffer.readInt32LE(4) : buffer.readInt32BE(4);
  const readDouble = (offset: number): number =>
    isLittleEndian ? buffer.readDoubleLE(offset) : buffer.readDoubleBE(offset);
  let envelope: Envelope | null = null;
  let headerSize = 8;
  if (envelopeType === 1) {
    envelope = { minX: readDouble(8), maxX: readDouble(16), minY: readDouble(24), maxY: readDouble(32) };
    headerSize += 32;
  } else if (envelopeType !== 0) {
    throw new Error(`unsupported envelope type ${envelopeType}`);
  }
  return { version: buffer.readUInt8(2), flags, srsId, envelope, geometry: parseWkb(buffer.subarray(headerSize)) };
};

/**
 * Call `close` to close the database and delete the temporary file.
 */
export const openGeoPackage = async (
  content: Uint8Array,
): Promise<{ db: DatabaseSync; close: () => Promise<void> }> => {
  const dir = await mkdtemp(join(tmpdir(), 'gpkg-test-'));
  const filePath = join(dir, 'test.gpkg');
  await writeFile(filePath, content);
  const db = new DatabaseSync(filePath, { readOnly: true });
  return {
    db,
    close: async () => {
      db.close();
      await rm(dir, { recursive: true, force: true });
    },
  };
};
