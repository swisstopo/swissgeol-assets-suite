import {
  encodeGeoPackageGeometry,
  readWkbGeometryType,
  WkbGeometryType,
} from '@/features/assets/export/geopackage/geopackage-geometry';
import {
  decodeGeoPackageGeometry,
  wkbMultiLineString,
  wkbPoint,
} from '@/features/assets/export/geopackage/geopackage.test-utils';

describe('geopackage-geometry', () => {
  describe(encodeGeoPackageGeometry, () => {
    it('writes a little-endian header without envelope', () => {
      const wkb = wkbPoint([2600000, 1200000]);
      const blob = encodeGeoPackageGeometry({ wkb, srsId: 2056 });

      expect(blob.subarray(0, 2).toString('ascii')).toEqual('GP');
      expect(blob[2]).toEqual(0); // version
      expect(blob[3]).toEqual(0b0000_0001); // little-endian, no envelope, not empty
      expect(blob.readInt32LE(4)).toEqual(2056);
      expect(blob.length).toEqual(8 + wkb.length);
      expect(blob.subarray(8).equals(wkb)).toBe(true);
    });

    it('writes an XY envelope in the order minx, maxx, miny, maxy', () => {
      const wkb = wkbMultiLineString([
        [
          [2600000, 1200000],
          [2601000, 1201000],
        ],
      ]);
      const blob = encodeGeoPackageGeometry({
        wkb,
        srsId: 2056,
        envelope: { minX: 2600000, maxX: 2601000, minY: 1200000, maxY: 1201000 },
      });

      expect(blob[3]).toEqual(0b0000_0011); // little-endian, envelope type 1
      expect(blob.readDoubleLE(8)).toEqual(2600000);
      expect(blob.readDoubleLE(16)).toEqual(2601000);
      expect(blob.readDoubleLE(24)).toEqual(1200000);
      expect(blob.readDoubleLE(32)).toEqual(1201000);
      expect(blob.subarray(40).equals(wkb)).toBe(true);
    });

    it('can be decoded again', () => {
      const blob = encodeGeoPackageGeometry({ wkb: wkbPoint([2611111.5, 1222222.25]), srsId: 2056 });
      expect(decodeGeoPackageGeometry(blob)).toEqual({
        version: 0,
        flags: 1,
        srsId: 2056,
        envelope: null,
        geometry: { type: WkbGeometryType.Point, coordinates: [2611111.5, 1222222.25] },
      });
    });
  });

  describe(readWkbGeometryType, () => {
    it('reads the type of little-endian WKB', () => {
      expect(readWkbGeometryType(wkbPoint([1, 2]))).toEqual(WkbGeometryType.Point);
    });

    it('reads the type of big-endian WKB', () => {
      const wkb = Buffer.alloc(21);
      wkb.writeUInt8(0, 0);
      wkb.writeUInt32BE(WkbGeometryType.MultiPolygon, 1);
      expect(readWkbGeometryType(wkb)).toEqual(WkbGeometryType.MultiPolygon);
    });

    it('rejects truncated WKB', () => {
      expect(() => readWkbGeometryType(Buffer.from([1, 1]))).toThrow();
    });

    it('rejects an invalid byte-order marker', () => {
      const wkb = Buffer.from([2, 0, 0, 0, 1]);

      expect(() => readWkbGeometryType(wkb)).toThrow('invalid WKB byte order: 2');
    });
  });
});
