import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WkbGeometryType } from '@/features/assets/export/geopackage/geopackage-geometry';
import {
  GEOPACKAGE_APPLICATION_ID,
  GEOPACKAGE_USER_VERSION,
  GeoPackageColumnType,
  GeoPackageFeatureLayerDefinition,
  GeoPackageGeometryType,
  GeoPackageGeometryTypeError,
  GeoPackageWriter,
  withTemporaryGeoPackage,
} from '@/features/assets/export/geopackage/geopackage-writer';
import {
  decodeGeoPackageGeometry,
  envelopeOf,
  openGeoPackage,
  wkbMultiLineString,
  wkbMultiPolygon,
  wkbPoint,
} from '@/features/assets/export/geopackage/geopackage.test-utils';
import { SRS_LV95 } from '@/features/assets/export/geopackage/spatial-ref-sys';

const ATTRIBUTES = [
  { name: 'asset_id', type: GeoPackageColumnType.Integer },
  { name: 'title', type: GeoPackageColumnType.Text },
  { name: 'created_at', type: GeoPackageColumnType.Date },
  { name: 'national_interest', type: GeoPackageColumnType.Boolean },
];

const layer = (name: string, geometryType: GeoPackageGeometryType): GeoPackageFeatureLayerDefinition => ({
  name,
  geometryType,
  srs: SRS_LV95,
  attributes: ATTRIBUTES,
});

describe(GeoPackageWriter, () => {
  let tmpRoot: string;

  beforeEach(async () => {
    tmpRoot = await mkdtemp(join(tmpdir(), 'gpkg-writer-test-'));
  });

  afterEach(async () => {
    await rm(tmpRoot, { recursive: true, force: true });
  });

  const build = (fn: (writer: GeoPackageWriter) => void | Promise<void>) => withTemporaryGeoPackage(fn, { tmpRoot });

  const buildLayers = () =>
    build((writer) => {
      writer.createFeatureLayer(layer('points', GeoPackageGeometryType.Point));
      writer.createFeatureLayer(layer('lines', GeoPackageGeometryType.MultiLineString));
      writer.createFeatureLayer(layer('polygons', GeoPackageGeometryType.MultiPolygon));
      writer.insertFeature('points', {
        wkb: wkbPoint([2600000, 1200000]),
        envelope: envelopeOf([[2600000, 1200000]]),
        values: [1, 'Point "A"', '2020-03-04', true],
      });
      writer.insertFeature('points', {
        wkb: wkbPoint([2650000.5, 1250000.25]),
        envelope: envelopeOf([[2650000.5, 1250000.25]]),
        values: [2, null, null, false],
      });
      const line: [number, number][] = [
        [2600000, 1200000],
        [2601000, 1201000],
      ];
      writer.insertFeature('lines', {
        wkb: wkbMultiLineString([line]),
        envelope: envelopeOf(line),
        values: [1, 'Line', '0164-04-16', true],
      });
    });

  it('creates a valid GeoPackage 1.2', async () => {
    const { db, close } = await openGeoPackage(await buildLayers());
    try {
      expect(db.prepare('PRAGMA application_id').get()).toEqual({ application_id: GEOPACKAGE_APPLICATION_ID });
      expect(db.prepare('PRAGMA user_version').get()).toEqual({ user_version: GEOPACKAGE_USER_VERSION });
      expect(db.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }]);
      expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);

      const tables = db
        .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
        .all()
        .map((row) => row.name);
      expect(tables).toEqual([
        'gpkg_contents',
        'gpkg_geometry_columns',
        'gpkg_spatial_ref_sys',
        'lines',
        'points',
        'polygons',
      ]);
    } finally {
      await close();
    }
  });

  it('registers the required spatial reference systems and EPSG:2056', async () => {
    const { db, close } = await openGeoPackage(await buildLayers());
    try {
      const rows = db.prepare('SELECT * FROM gpkg_spatial_ref_sys ORDER BY srs_id').all();
      expect(rows.map((row) => [row.srs_id, row.organization, row.organization_coordsys_id])).toEqual([
        [-1, 'NONE', -1],
        [0, 'NONE', 0],
        [2056, 'EPSG', 2056],
        [4326, 'EPSG', 4326],
      ]);
      const lv95 = rows.find((row) => row.srs_id === 2056);
      expect(lv95?.srs_name).toEqual('CH1903+ / LV95');
      expect(lv95?.definition).toMatch(/^PROJCS\["CH1903\+ \/ LV95",.*AUTHORITY\["EPSG","2056"\]\]$/);
    } finally {
      await close();
    }
  });

  it('registers all layers with their extents', async () => {
    const { db, close } = await openGeoPackage(await buildLayers());
    try {
      const contents = db.prepare('SELECT * FROM gpkg_contents ORDER BY table_name').all();
      expect(contents.map(({ last_change: _, ...row }) => row)).toEqual([
        {
          table_name: 'lines',
          data_type: 'features',
          identifier: 'lines',
          description: '',
          min_x: 2600000,
          min_y: 1200000,
          max_x: 2601000,
          max_y: 1201000,
          srs_id: 2056,
        },
        {
          table_name: 'points',
          data_type: 'features',
          identifier: 'points',
          description: '',
          min_x: 2600000,
          min_y: 1200000,
          max_x: 2650000.5,
          max_y: 1250000.25,
          srs_id: 2056,
        },
        {
          table_name: 'polygons',
          data_type: 'features',
          identifier: 'polygons',
          description: '',
          min_x: null,
          min_y: null,
          max_x: null,
          max_y: null,
          srs_id: 2056,
        },
      ]);
      contents.forEach((row) => expect(row.last_change).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/));

      expect(db.prepare('SELECT * FROM gpkg_geometry_columns ORDER BY table_name').all()).toEqual([
        { table_name: 'lines', column_name: 'geom', geometry_type_name: 'MULTILINESTRING', srs_id: 2056, z: 0, m: 0 },
        { table_name: 'points', column_name: 'geom', geometry_type_name: 'POINT', srs_id: 2056, z: 0, m: 0 },
        { table_name: 'polygons', column_name: 'geom', geometry_type_name: 'MULTIPOLYGON', srs_id: 2056, z: 0, m: 0 },
      ]);
    } finally {
      await close();
    }
  });

  it('creates feature tables with typed columns', async () => {
    const { db, close } = await openGeoPackage(await buildLayers());
    try {
      const columns = db
        .prepare(`PRAGMA table_info('points')`)
        .all()
        .map((row) => [row.name, row.type, row.pk]);
      expect(columns).toEqual([
        ['fid', 'INTEGER', 1],
        ['geom', 'POINT', 0],
        ['asset_id', 'INTEGER', 0],
        ['title', 'TEXT', 0],
        ['created_at', 'DATE', 0],
        ['national_interest', 'BOOLEAN', 0],
      ]);
      expect(db.prepare(`SELECT sql FROM sqlite_master WHERE name = 'points'`).get()?.sql).toContain(
        '"fid" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL',
      );
    } finally {
      await close();
    }
  });

  it('writes features with geometries and attribute values', async () => {
    const { db, close } = await openGeoPackage(await buildLayers());
    try {
      const points = db.prepare('SELECT * FROM points ORDER BY fid').all();
      expect(points.map(({ geom: _, ...row }) => row)).toEqual([
        { fid: 1, asset_id: 1, title: 'Point "A"', created_at: '2020-03-04', national_interest: 1 },
        { fid: 2, asset_id: 2, title: null, created_at: null, national_interest: 0 },
      ]);
      expect(decodeGeoPackageGeometry(points[0].geom as Uint8Array)).toEqual({
        version: 0,
        flags: 0b01,
        srsId: 2056,
        envelope: null,
        geometry: { type: WkbGeometryType.Point, coordinates: [2600000, 1200000] },
      });

      const lines = db.prepare('SELECT * FROM lines').all();
      expect(lines).toHaveLength(1);
      expect(lines[0].created_at).toEqual('0164-04-16');
      expect(decodeGeoPackageGeometry(lines[0].geom as Uint8Array)).toEqual({
        version: 0,
        flags: 0b11,
        srsId: 2056,
        envelope: { minX: 2600000, maxX: 2601000, minY: 1200000, maxY: 1201000 },
        geometry: {
          type: WkbGeometryType.MultiLineString,
          coordinates: [
            [
              [2600000, 1200000],
              [2601000, 1201000],
            ],
          ],
        },
      });

      expect(db.prepare('SELECT COUNT(*) AS count FROM polygons').get()).toEqual({ count: 0 });
    } finally {
      await close();
    }
  });

  it('writes polygons', async () => {
    const ring: [number, number][] = [
      [2600000, 1200000],
      [2601000, 1200000],
      [2601000, 1201000],
      [2600000, 1200000],
    ];
    const content = await build((writer) => {
      writer.createFeatureLayer(layer('polygons', GeoPackageGeometryType.MultiPolygon));
      writer.insertFeature('polygons', {
        wkb: wkbMultiPolygon([[ring]]),
        envelope: envelopeOf(ring),
        values: [1, null, null, null],
      });
    });
    const { db, close } = await openGeoPackage(content);
    try {
      const row = db.prepare('SELECT geom FROM polygons').get();
      expect(decodeGeoPackageGeometry(row?.geom as Uint8Array).geometry).toEqual({
        type: WkbGeometryType.MultiPolygon,
        coordinates: [[ring]],
      });
    } finally {
      await close();
    }
  });

  it('rejects geometries not matching the layer type', async () => {
    await expect(
      build((writer) => {
        writer.createFeatureLayer(layer('lines', GeoPackageGeometryType.MultiLineString));
        writer.insertFeature('lines', {
          wkb: wkbPoint([2600000, 1200000]),
          envelope: envelopeOf([[2600000, 1200000]]),
          values: [1, null, null, null],
        });
      }),
    ).rejects.toEqual(new GeoPackageGeometryTypeError('lines', WkbGeometryType.MultiLineString, WkbGeometryType.Point));
  });

  it('rejects features with a wrong number of values', async () => {
    await expect(
      build((writer) => {
        writer.createFeatureLayer(layer('points', GeoPackageGeometryType.Point));
        writer.insertFeature('points', { wkb: wkbPoint([1, 2]), envelope: envelopeOf([[1, 2]]), values: [1] });
      }),
    ).rejects.toThrow('expected 4 attribute values, got 1');
  });

  it('rejects reserved attribute names', async () => {
    await expect(
      build((writer) =>
        writer.createFeatureLayer({
          ...layer('points', GeoPackageGeometryType.Point),
          attributes: [{ name: 'geom', type: GeoPackageColumnType.Text }],
        }),
      ),
    ).rejects.toThrow(/reserved/);
  });

  describe(withTemporaryGeoPackage, () => {
    it('removes the temporary directory after success', async () => {
      const content = await buildLayers();
      expect(content.length).toBeGreaterThan(0);
      expect(await readdir(tmpRoot)).toEqual([]);
    });

    it('removes the temporary directory after a failure', async () => {
      let createdFiles: string[] = [];
      await expect(
        build(async (writer) => {
          writer.createFeatureLayer(layer('points', GeoPackageGeometryType.Point));
          const [dir] = await readdir(tmpRoot);
          createdFiles = await readdir(join(tmpRoot, dir));
          throw new Error('build failed');
        }),
      ).rejects.toThrow('build failed');
      expect(createdFiles).toEqual(['assets.gpkg']);
      expect(await readdir(tmpRoot)).toEqual([]);
    });
  });
});
