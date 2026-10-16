import { DatabaseSync } from 'node:sqlite';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NextFunction, Request, Response } from 'express';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { clearPrismaAssets, setupDB } from '../../../../../../test/setup-db';
import { PrismaService } from '@/core/prisma.service';
import { AssetRepo } from '@/features/assets/asset.repo';
import { AssetExportMetadataService } from '@/features/assets/export/asset-export-metadata.service';
import { AssetExportController } from '@/features/assets/export/asset-export.controller';
import { AssetExportService } from '@/features/assets/export/asset-export.service';
import { ExportFixture, seedExportFixture } from '@/features/assets/export/asset-export.test-utils';
import { AssetGeoPackageExportService } from '@/features/assets/export/asset-geopackage-export.service';
import { GEOPACKAGE_APPLICATION_ID } from '@/features/assets/export/geopackage/geopackage-writer';
import { openGeoPackage } from '@/features/assets/export/geopackage/geopackage.test-utils';
import { FileRepo } from '@/features/assets/files/file.repo';
import { ContactRepo } from '@/features/contacts/contact.repo';
import { GeometryExportRepo } from '@/features/geometries/geometry-export.repo';
import { WorkgroupRepo } from '@/features/workgroups/workgroup.repo';

describe(AssetExportController, () => {
  const prisma = new PrismaService();
  let app: INestApplication;
  let baseUrl: string;
  let fixture: ExportFixture;

  const post = (path: string, body: unknown): Promise<globalThis.Response> =>
    fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  const readGeoPackage = async <T>(response: globalThis.Response, fn: (db: DatabaseSync) => T): Promise<T> => {
    const { db, close } = await openGeoPackage(new Uint8Array(await response.arrayBuffer()));
    try {
      return fn(db);
    } finally {
      await close();
    }
  };

  beforeAll(async () => {
    await setupDB(prisma);
    const moduleRef = await Test.createTestingModule({
      controllers: [AssetExportController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        AssetRepo,
        FileRepo,
        ContactRepo,
        WorkgroupRepo,
        GeometryExportRepo,
        AssetExportMetadataService,
        AssetExportService,
        AssetGeoPackageExportService,
      ],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.use((req: Request & { user?: unknown }, _res: Response, next: NextFunction) => {
      req.user = fixture.user;
      next();
    });
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearPrismaAssets(prisma);
    fixture = await seedExportFixture(prisma);
  });

  describe('POST /assets/export/geopackage', () => {
    it('responds with a GeoPackage file', async () => {
      const response = await post('/assets/export/geopackage', { assetIds: [fixture.full.id] });

      expect(response.status).toEqual(201);
      expect(response.headers.get('Content-Type')).toEqual('application/geopackage+sqlite3');
      expect(response.headers.get('Content-Disposition')).toEqual('attachment; filename="assets.gpkg"');
      const contentLength = Number(response.headers.get('Content-Length'));
      expect(contentLength).toBeGreaterThan(0);

      const content = new Uint8Array(await response.clone().arrayBuffer());
      expect(content.length).toEqual(contentLength);
      expect(Buffer.from(content.subarray(0, 16)).toString('ascii')).toEqual('SQLite format 3\0');

      await readGeoPackage(response, (db) => {
        expect(db.prepare('PRAGMA application_id').get()?.application_id).toEqual(GEOPACKAGE_APPLICATION_ID);
        expect(db.prepare('SELECT COUNT(*) AS count FROM points').get()?.count).toEqual(2);
      });
    });

    it('uses German labels by default', async () => {
      const response = await post('/assets/export/geopackage', { assetIds: [fixture.full.id] });
      const restrictionType = await readGeoPackage(
        response,
        (db) => db.prepare('SELECT restriction_type FROM points').get()?.restriction_type,
      );
      expect(restrictionType).toEqual('gesperrt bis');
    });

    it('uses the requested language', async () => {
      const response = await post('/assets/export/geopackage?lang=fr', { assetIds: [fixture.full.id] });
      const restrictionType = await readGeoPackage(
        response,
        (db) => db.prepare('SELECT restriction_type FROM points').get()?.restriction_type,
      );
      expect(restrictionType).toEqual("bloqué jusqu'au");
    });

    it('falls back to German for unsupported languages', async () => {
      const response = await post('/assets/export/geopackage?lang=xx', { assetIds: [fixture.full.id] });
      const restrictionType = await readGeoPackage(
        response,
        (db) => db.prepare('SELECT restriction_type FROM points').get()?.restriction_type,
      );
      expect(restrictionType).toEqual('gesperrt bis');
    });

    it('omits inaccessible assets', async () => {
      const response = await post('/assets/export/geopackage', { assetIds: [fixture.foreign.id] });
      expect(response.status).toEqual(201);
      const count = await readGeoPackage(response, (db) => db.prepare('SELECT COUNT(*) AS count FROM points').get());
      expect(count).toEqual({ count: 0 });
    });

    it('rejects an empty selection', async () => {
      const response = await post('/assets/export/geopackage', { assetIds: [] });
      expect(response.status).toEqual(400);
    });

    it('rejects an invalid body', async () => {
      const response = await post('/assets/export/geopackage', { assetIds: ['abc'] });
      expect(response.status).toEqual(400);
    });
  });

  describe('POST /assets/export/csv', () => {
    it('responds with a CSV file', async () => {
      const response = await post('/assets/export/csv', { assetIds: [fixture.full.id] });
      expect(response.status).toEqual(201);
      expect(response.headers.get('Content-Type')).toEqual('text/csv; charset=utf-8');
      const lines = (await response.text()).split('\n');
      expect(lines).toHaveLength(2);
    });
  });
});
