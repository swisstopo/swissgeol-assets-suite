// eslint-disable-next-line @nx/enforce-module-boundaries
import { clearPrismaAssets, setupDB } from '../../../../../test/setup-db';
import { PrismaService } from '@/core/prisma.service';
import { ExportFixture, seedExportFixture } from '@/features/assets/export/asset-export.test-utils';
import { WkbGeometryType } from '@/features/assets/export/geopackage/geopackage-geometry';
import { parseWkb } from '@/features/assets/export/geopackage/geopackage.test-utils';
import { ExportGeometryLayer, GeometryExportRepo } from '@/features/geometries/geometry-export.repo';

describe(GeometryExportRepo, () => {
  const prisma = new PrismaService();
  const repo = new GeometryExportRepo(prisma);
  let fixture: ExportFixture;

  beforeAll(async () => {
    await setupDB(prisma);
  });

  beforeEach(async () => {
    await clearPrismaAssets(prisma);
    fixture = await seedExportFixture(prisma);
  });

  it('returns nothing for an empty selection', async () => {
    expect(await repo.listForExport([])).toEqual({ geometries: [], skipped: [] });
  });

  it('returns nothing for assets without geometries', async () => {
    expect(await repo.listForExport([fixture.minimal.id])).toEqual({ geometries: [], skipped: [] });
  });

  it('returns points, multi-lines and multi-polygons with unswapped coordinates', async () => {
    const { geometries, skipped } = await repo.listForExport([fixture.full.id]);

    expect(skipped).toEqual([]);
    expect(geometries.map((it) => [it.layer, it.geometryType, it.srid, it.assetId])).toEqual([
      [ExportGeometryLayer.Points, 'POINT', 2056, fixture.full.id],
      [ExportGeometryLayer.Points, 'POINT', 2056, fixture.full.id],
      [ExportGeometryLayer.Lines, 'MULTILINESTRING', 2056, fixture.full.id],
      [ExportGeometryLayer.Polygons, 'MULTIPOLYGON', 2056, fixture.full.id],
    ]);
    expect(geometries.map((it) => it.id[0])).toEqual(['l', 'l', 't', 'a']);

    const [point1, point2, line, polygon] = geometries;
    expect(parseWkb(point1.wkb)).toEqual({ type: WkbGeometryType.Point, coordinates: [2600000, 1200000] });
    expect(parseWkb(point2.wkb)).toEqual({ type: WkbGeometryType.Point, coordinates: [2600100.5, 1200200.25] });
    expect(point2.envelope).toEqual({ minX: 2600100.5, maxX: 2600100.5, minY: 1200200.25, maxY: 1200200.25 });

    expect(parseWkb(line.wkb)).toEqual({
      type: WkbGeometryType.MultiLineString,
      coordinates: [
        [
          [2600000, 1200000],
          [2601000, 1201000],
          [2602000, 1200500],
        ],
      ],
    });
    expect(line.envelope).toEqual({ minX: 2600000, maxX: 2602000, minY: 1200000, maxY: 1201000 });

    expect(parseWkb(polygon.wkb)).toEqual({
      type: WkbGeometryType.MultiPolygon,
      coordinates: [
        [
          [
            [2600000, 1200000],
            [2601000, 1200000],
            [2601000, 1201000],
            [2600000, 1200000],
          ],
        ],
      ],
    });
    expect(polygon.envelope).toEqual({ minX: 2600000, maxX: 2601000, minY: 1200000, maxY: 1201000 });

    // The WKB is little-endian (NDR).
    geometries.forEach((it) => expect(it.wkb[0]).toEqual(1));
  });

  it('exports all rings of polygons with holes', async () => {
    await prisma.$executeRaw`
      INSERT INTO public.study_area (asset_id, geom)
      VALUES (${fixture.minimal.id}, ST_GeomFromText(
        'POLYGON((2600000 1200000, 2610000 1200000, 2610000 1210000, 2600000 1200000), (2605000 1201000, 2606000 1201000, 2606000 1202000, 2605000 1201000))',
        2056
      ))
    `;
    const { geometries } = await repo.listForExport([fixture.minimal.id]);
    expect(geometries).toHaveLength(1);
    const parsed = parseWkb(geometries[0].wkb);
    expect(parsed.type).toEqual(WkbGeometryType.MultiPolygon);
    expect((parsed.coordinates as unknown[][])[0]).toHaveLength(2);
  });

  it('skips NULL and empty geometries', async () => {
    await prisma.$executeRaw`INSERT INTO public.study_location (asset_id, geom) VALUES (${fixture.minimal.id}, NULL)`;
    await prisma.$executeRaw`
      INSERT INTO public.study_trace (asset_id, geom)
      VALUES (${fixture.minimal.id}, ST_GeomFromText('LINESTRING EMPTY', 2056))
    `;
    await prisma.$executeRaw`
      INSERT INTO public.study_area (asset_id, geom)
      VALUES (${fixture.minimal.id}, ST_GeomFromText('POLYGON EMPTY', 2056))
    `;
    const { geometries, skipped } = await repo.listForExport([fixture.minimal.id]);
    expect(geometries).toEqual([]);
    expect(skipped.map((it) => it.id[0])).toEqual(['l', 't', 'a']);
    skipped.forEach((it) => expect(it.assetId).toEqual(fixture.minimal.id));
  });

  it('only returns geometries of the requested assets', async () => {
    const { geometries } = await repo.listForExport([fixture.foreign.id]);
    expect(geometries).toHaveLength(1);
    expect(geometries[0].assetId).toEqual(fixture.foreign.id);
    expect(parseWkb(geometries[0].wkb)).toEqual({ type: WkbGeometryType.Point, coordinates: [2700000, 1250000] });
  });

  it('orders geometries by asset', async () => {
    const { geometries } = await repo.listForExport([fixture.foreign.id, fixture.full.id]);
    const assetIds = geometries.map((it) => it.assetId);
    expect(assetIds).toEqual([...assetIds].sort((a, b) => a - b));
    expect(new Set(assetIds)).toEqual(new Set([fixture.full.id, fixture.foreign.id]));
  });
});
