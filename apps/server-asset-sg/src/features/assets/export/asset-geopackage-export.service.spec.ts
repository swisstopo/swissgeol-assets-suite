import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { LocalDate } from '@asset-sg/shared/v2';
import { InternalServerErrorException } from '@nestjs/common';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { clearPrismaAssets, setupDB } from '../../../../../../test/setup-db';
import { PrismaService } from '@/core/prisma.service';
import { AssetExportMetadataService } from '@/features/assets/export/asset-export-metadata.service';
import { CSV_COLUMN_KEYS, CSV_PUBLIC_COLUMNS } from '@/features/assets/export/asset-export.i18n';
import { createExportRepos, ExportFixture, seedExportFixture } from '@/features/assets/export/asset-export.test-utils';
import { AssetGeoPackageExportService, formatDate } from '@/features/assets/export/asset-geopackage-export.service';
import { WkbGeometryType } from '@/features/assets/export/geopackage/geopackage-geometry';
import {
  decodeGeoPackageGeometry,
  openGeoPackage,
  wkbMultiLineString,
  wkbPoint,
} from '@/features/assets/export/geopackage/geopackage.test-utils';
import { ExportGeometries, ExportGeometryLayer, GeometryExportRepo } from '@/features/geometries/geometry-export.repo';

describe(AssetGeoPackageExportService, () => {
  const prisma = new PrismaService();
  const { assetRepo, contactRepo, workgroupRepo } = createExportRepos(prisma);
  const metadataService = new AssetExportMetadataService(prisma, assetRepo, contactRepo, workgroupRepo);
  const geometryExportRepo = new GeometryExportRepo(prisma);
  const service = new AssetGeoPackageExportService(metadataService, geometryExportRepo);
  let fixture: ExportFixture;

  const exportAndOpen = async (
    content: Promise<Buffer>,
    fn: (db: DatabaseSync) => void | Promise<void>,
  ): Promise<void> => {
    const { db, close } = await openGeoPackage(await content);
    try {
      await fn(db);
    } finally {
      await close();
    }
  };

  const countRows = (db: DatabaseSync, table: string): number =>
    db.prepare(`SELECT COUNT(*) AS count FROM "${table}"`).get()?.count as number;

  beforeAll(async () => {
    await setupDB(prisma);
  });

  beforeEach(async () => {
    await clearPrismaAssets(prisma);
    fixture = await seedExportFixture(prisma);
  });

  afterEach(() => {
    delete process.env.ANONYMOUS_MODE;
  });

  it('exports one feature per geometry with the asset metadata as attributes', async () => {
    const content = service.exportAssetsAsGeoPackage(
      [fixture.minimal.id, fixture.full.id, fixture.foreign.id],
      fixture.user,
      'de',
    );
    await exportAndOpen(content, (db) => {
      expect(countRows(db, 'points')).toEqual(2);
      expect(countRows(db, 'lines')).toEqual(1);
      expect(countRows(db, 'polygons')).toEqual(1);

      const expectedAttributes = {
        title: 'Alpha; "quoted"',
        status: 'Draft',
        restriction_type: 'gesperrt bis',
        restriction_date: '2030-01-15',
        topic: 'Bohrungen',
        kind: '2D-Seismik',
        language: 'englisch',
        format: '3D-spezifisches Format',
        original_title: 'Original A',
        created_at: '2020-03-04',
        received_at: '2020-05-06',
        national_interest: 1,
        national_interest_type: 'Test nationales Interesse',
        contact_role: 'Auftraggeber,Autor,Einlieferer',
        contact_kind: 'Bundesbehörde,Privatfirma oder Privatperson,Andere',
        contact_name: 'Initiator AG,Author GmbH,Supplier SA',
        asset_id: fixture.full.id,
        sgs_id: 4711,
        alternative_ids: 'ID-1,ID-2',
        alternative_id_descriptions: 'Desc 1,Desc 2',
        documents: `export-test-${fixture.full.id}.pdf`,
        workgroup: 'Default',
      };
      for (const layer of Object.values(ExportGeometryLayer)) {
        const rows = db.prepare(`SELECT * FROM "${layer}" ORDER BY fid`).all();
        rows.forEach(({ fid: _fid, geom: _geom, ...attributes }) => expect(attributes).toEqual(expectedAttributes));
      }

      const points = db.prepare('SELECT geom FROM points ORDER BY fid').all();
      expect(points.map((row) => decodeGeoPackageGeometry(row.geom as Uint8Array).geometry)).toEqual([
        { type: WkbGeometryType.Point, coordinates: [2600000, 1200000] },
        { type: WkbGeometryType.Point, coordinates: [2600100.5, 1200200.25] },
      ]);
      const line = decodeGeoPackageGeometry(db.prepare('SELECT geom FROM lines').get()?.geom as Uint8Array);
      expect(line.srsId).toEqual(2056);
      expect(line.geometry.type).toEqual(WkbGeometryType.MultiLineString);
      const polygon = decodeGeoPackageGeometry(db.prepare('SELECT geom FROM polygons').get()?.geom as Uint8Array);
      expect(polygon.geometry.type).toEqual(WkbGeometryType.MultiPolygon);
    });
  });

  it('uses the columns and column order of the metadata projection', async () => {
    const dataset = await metadataService.load([fixture.full.id], fixture.user, 'de');
    await exportAndOpen(service.build(dataset), (db) => {
      for (const layer of Object.values(ExportGeometryLayer)) {
        const columns = db
          .prepare(`PRAGMA table_info("${layer}")`)
          .all()
          .map((row) => [row.name, row.type]);
        expect(columns).toEqual([
          ['fid', 'INTEGER'],
          ['geom', { points: 'POINT', lines: 'MULTILINESTRING', polygons: 'MULTIPOLYGON' }[layer]],
          ['title', 'TEXT'],
          ['status', 'TEXT'],
          ['restriction_type', 'TEXT'],
          ['restriction_date', 'DATE'],
          ['topic', 'TEXT'],
          ['kind', 'TEXT'],
          ['language', 'TEXT'],
          ['format', 'TEXT'],
          ['original_title', 'TEXT'],
          ['created_at', 'DATE'],
          ['received_at', 'DATE'],
          ['national_interest', 'BOOLEAN'],
          ['national_interest_type', 'TEXT'],
          ['contact_role', 'TEXT'],
          ['contact_kind', 'TEXT'],
          ['contact_name', 'TEXT'],
          ['asset_id', 'INTEGER'],
          ['sgs_id', 'INTEGER'],
          ['alternative_ids', 'TEXT'],
          ['alternative_id_descriptions', 'TEXT'],
          ['documents', 'TEXT'],
          ['workgroup', 'TEXT'],
        ]);
        expect(columns.slice(2).map(([name]) => name)).toEqual(dataset.columns.map((column) => column.name));
      }
    });
  });

  it('represents missing and empty values as NULL', async () => {
    await prisma.$executeRaw`
      INSERT INTO public.study_location (asset_id, geom)
      VALUES (${fixture.minimal.id}, ST_GeomFromText('POINT(2610000 1210000)', 2056))
    `;
    const content = service.exportAssetsAsGeoPackage([fixture.minimal.id], fixture.user, 'de');
    await exportAndOpen(content, (db) => {
      const { fid: _fid, geom: _geom, ...attributes } = db.prepare('SELECT * FROM points').get() ?? {};
      expect(attributes).toEqual({
        title: 'Beta',
        status: 'Draft',
        restriction_type: 'frei',
        restriction_date: null,
        topic: null,
        kind: 'Bericht',
        language: null,
        format: 'PDF',
        original_title: null,
        created_at: '2021-01-02',
        received_at: null,
        national_interest: 0,
        national_interest_type: null,
        contact_role: null,
        contact_kind: null,
        contact_name: null,
        asset_id: fixture.minimal.id,
        sgs_id: null,
        alternative_ids: null,
        alternative_id_descriptions: null,
        documents: null,
        workgroup: 'Default',
      });
    });
  });

  it('localizes labels', async () => {
    const content = service.exportAssetsAsGeoPackage([fixture.full.id], fixture.user, 'fr');
    await exportAndOpen(content, (db) => {
      const row = db.prepare('SELECT * FROM points').get();
      expect(row?.restriction_type).toEqual("bloqué jusqu'au");
      expect(row?.topic).toEqual('Forages');
      expect(row?.language).toEqual('anglais');
      expect(row?.national_interest_type).toEqual('Test intérêt national');
    });
  });

  it('creates empty layers if no selected asset has geometries', async () => {
    const content = service.exportAssetsAsGeoPackage([fixture.minimal.id, fixture.foreign.id], fixture.user, 'de');
    await exportAndOpen(content, (db) => {
      expect(countRows(db, 'points')).toEqual(0);
      expect(countRows(db, 'lines')).toEqual(0);
      expect(countRows(db, 'polygons')).toEqual(0);
      expect(db.prepare('SELECT COUNT(*) AS count FROM gpkg_contents').get()?.count).toEqual(3);
    });
  });

  it('omits non-public columns in anonymous mode', async () => {
    process.env.ANONYMOUS_MODE = 'true';
    const content = service.exportAssetsAsGeoPackage([fixture.full.id], fixture.user, 'de');
    await exportAndOpen(content, (db) => {
      const columns = db
        .prepare(`PRAGMA table_info("points")`)
        .all()
        .map((row) => row.name);
      expect(columns).not.toContain('original_title');
      expect(columns).not.toContain('sgs_id');
      expect(columns).not.toContain('alternative_ids');
      expect(columns).not.toContain('alternative_id_descriptions');
      expect(columns).toHaveLength(2 + CSV_COLUMN_KEYS.filter((key) => CSV_PUBLIC_COLUMNS[key]).length);
    });
  });

  describe('unexpected geometries', () => {
    let tmpRoot: string;

    beforeEach(async () => {
      tmpRoot = await mkdtemp(join(tmpdir(), 'gpkg-service-test-'));
    });

    afterEach(async () => {
      await rm(tmpRoot, { recursive: true, force: true });
    });

    const buildWithGeometries = async (geometries: ExportGeometries): Promise<Buffer> => {
      const stubRepo = { listForExport: async () => geometries } as unknown as GeometryExportRepo;
      const stubbedService = new AssetGeoPackageExportService(metadataService, stubRepo);
      const dataset = await metadataService.load([fixture.full.id], fixture.user, 'de');
      return stubbedService.build(dataset, { tmpRoot });
    };

    const envelope = { minX: 0, maxX: 1, minY: 0, maxY: 1 };

    it('fails with a generic error on unexpected geometry types', async () => {
      const result = buildWithGeometries({
        geometries: [
          {
            id: 'l1',
            assetId: fixture.full.id,
            layer: ExportGeometryLayer.Points,
            geometryType: 'MULTIPOINT',
            srid: 2056,
            wkb: wkbPoint([0, 0]),
            envelope,
          },
        ],
        skipped: [],
      });
      await expect(result).rejects.toEqual(new InternalServerErrorException());
      expect(await readdir(tmpRoot)).toEqual([]);
    });

    it('fails with a generic error on unexpected SRIDs', async () => {
      const result = buildWithGeometries({
        geometries: [
          {
            id: 'l1',
            assetId: fixture.full.id,
            layer: ExportGeometryLayer.Points,
            geometryType: 'POINT',
            srid: 4326,
            wkb: wkbPoint([0, 0]),
            envelope,
          },
        ],
        skipped: [],
      });
      await expect(result).rejects.toEqual(new InternalServerErrorException());
    });

    it('fails with a generic error and cleans up if the WKB does not match the layer', async () => {
      const result = buildWithGeometries({
        geometries: [
          {
            id: 't1',
            assetId: fixture.full.id,
            layer: ExportGeometryLayer.Lines,
            geometryType: 'MULTILINESTRING',
            srid: 2056,
            wkb: wkbPoint([0, 0]),
            envelope,
          },
        ],
        skipped: [],
      });
      await expect(result).rejects.toEqual(new InternalServerErrorException());
      expect(await readdir(tmpRoot)).toEqual([]);
    });

    it('removes temporary files after success', async () => {
      const content = await buildWithGeometries({
        geometries: [
          {
            id: 't1',
            assetId: fixture.full.id,
            layer: ExportGeometryLayer.Lines,
            geometryType: 'MULTILINESTRING',
            srid: 2056,
            wkb: wkbMultiLineString([
              [
                [0, 0],
                [1, 1],
              ],
            ]),
            envelope,
          },
        ],
        skipped: [],
      });
      expect(content.length).toBeGreaterThan(0);
      expect(await readdir(tmpRoot)).toEqual([]);
    });
  });
});

describe(formatDate, () => {
  it('formats dates as YYYY-MM-DD with a four-digit year', () => {
    expect(formatDate(LocalDate.of(2020, 3, 4))).toEqual('2020-03-04');
    expect(formatDate(LocalDate.of(164, 12, 31))).toEqual('0164-12-31');
  });
});
