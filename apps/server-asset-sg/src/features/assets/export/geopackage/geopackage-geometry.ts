export interface Envelope {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * The 2D geometry types of the OGC Simple Features specification, by their WKB type code.
 */
export enum WkbGeometryType {
  Point = 1,
  LineString = 2,
  Polygon = 3,
  MultiPoint = 4,
  MultiLineString = 5,
  MultiPolygon = 6,
  GeometryCollection = 7,
}

const MAGIC = [0x47, 0x50]; // 'GP'
const VERSION = 0;
const FLAG_LITTLE_ENDIAN = 0b0000_0001;
const FLAG_ENVELOPE_XY = 0b0000_0010; // envelope contents indicator 1: [minx, maxx, miny, maxy]
const HEADER_SIZE = 8;
const ENVELOPE_XY_SIZE = 4 * 8;

/**
 * Encodes a geometry as GeoPackage binary (GeoPackage 1.2, clause 2.1.3).
 *
 * @param wkb The geometry as 2D (ISO/OGC) WKB.
 */
export const encodeGeoPackageGeometry = ({
  wkb,
  srsId,
  envelope,
}: {
  wkb: Uint8Array;
  srsId: number;
  envelope?: Envelope | null;
}): Buffer => {
  const envelopeSize = envelope == null ? 0 : ENVELOPE_XY_SIZE;
  const header = Buffer.alloc(HEADER_SIZE + envelopeSize);
  header[0] = MAGIC[0];
  header[1] = MAGIC[1];
  header[2] = VERSION;
  header[3] = FLAG_LITTLE_ENDIAN | (envelope == null ? 0 : FLAG_ENVELOPE_XY);
  header.writeInt32LE(srsId, 4);
  if (envelope != null) {
    header.writeDoubleLE(envelope.minX, HEADER_SIZE);
    header.writeDoubleLE(envelope.maxX, HEADER_SIZE + 8);
    header.writeDoubleLE(envelope.minY, HEADER_SIZE + 16);
    header.writeDoubleLE(envelope.maxY, HEADER_SIZE + 24);
  }
  return Buffer.concat([header, wkb]);
};

/**
 * Codes of geometries with Z/M coordinates (ISO: +1000/+2000/+3000, EWKB: high bits) are returned unchanged.
 */
export const readWkbGeometryType = (wkb: Uint8Array): number => {
  if (wkb.length < 5) {
    throw new Error('invalid WKB: too short');
  }
  const view = new DataView(wkb.buffer, wkb.byteOffset, wkb.byteLength);
  const byteOrder = view.getUint8(0);
  if (byteOrder !== 0 && byteOrder !== 1) {
    throw new Error('invalid WKB: unknown byte order');
  }
  return view.getUint32(1, byteOrder === 1);
};
