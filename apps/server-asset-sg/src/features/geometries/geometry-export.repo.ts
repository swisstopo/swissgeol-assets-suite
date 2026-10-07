import { AssetId, GeometryId } from '@asset-sg/shared/v2';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/core/prisma.service';

export interface GeometryEnvelope {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export enum ExportGeometryLayer {
  Points = 'points',
  Lines = 'lines',
  Polygons = 'polygons',
}

/**
 * A geometry of an asset, prepared for export:
 * points are exported as `POINT`, lines as `MULTILINESTRING` and polygons as `MULTIPOLYGON`.
 */
export interface ExportGeometry {
  id: GeometryId;
  assetId: AssetId;
  layer: ExportGeometryLayer;
  geometryType: string;
  srid: number;
  wkb: Buffer;
  envelope: GeometryEnvelope;
}

export interface SkippedExportGeometry {
  id: GeometryId;
  assetId: AssetId;
}

export interface ExportGeometries {
  geometries: ExportGeometry[];

  /** Geometries that were not exported because they are `NULL` or empty. */
  skipped: SkippedExportGeometry[];
}

interface RawExportGeometry {
  id: string;
  sortId: number;
  layerOrder: number;
  assetId: number;
  layer: ExportGeometryLayer;
  geometryType: string | null;
  srid: number | null;
  /** Base64 encoded, as Prisma's handling of large `bytea` values in raw queries is very slow. */
  wkb: string | null;
  minX: number | null;
  maxX: number | null;
  minY: number | null;
  maxY: number | null;
}

/**
 * Reads asset geometries directly from the study tables for exports.
 *
 * Note that, unlike other geometry repos, this repo does not swap the coordinates:
 * the exported geometries have the same axis order as stored in the database.
 */
@Injectable()
export class GeometryExportRepo {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lists the geometries of the given assets, ordered by asset, layer and geometry id.
   * This does not check whether the assets may be accessed.
   */
  async listForExport(assetIds: AssetId[]): Promise<ExportGeometries> {
    if (assetIds.length === 0) {
      return { geometries: [], skipped: [] };
    }
    const ids = Prisma.join(assetIds);
    const rows = await this.prisma.$queryRaw<RawExportGeometry[]>`
      WITH geometries AS (
        SELECT 'l' || study_location_id AS id, study_location_id AS sort_id, asset_id, 'points' AS layer, 1 AS layer_order, geom AS geom
        FROM public.study_location
        WHERE asset_id IN (${ids})
        UNION ALL
        SELECT 't' || study_trace_id, study_trace_id, asset_id, 'lines', 2, ST_Multi(geom)
        FROM public.study_trace
        WHERE asset_id IN (${ids})
        UNION ALL
        SELECT 'a' || study_area_id, study_area_id, asset_id, 'polygons', 3, ST_Multi(geom)
        FROM public.study_area
        WHERE asset_id IN (${ids})
      )
      SELECT id,
             sort_id AS "sortId",
             layer_order AS "layerOrder",
             asset_id AS "assetId",
             layer,
             GeometryType(geom) AS "geometryType",
             ST_SRID(geom) AS srid,
             CASE WHEN geom IS NULL OR ST_IsEmpty(geom) THEN NULL ELSE encode(ST_AsBinary(geom, 'NDR'), 'base64') END AS wkb,
             ST_XMin(geom) AS "minX",
             ST_XMax(geom) AS "maxX",
             ST_YMin(geom) AS "minY",
             ST_YMax(geom) AS "maxY"
      FROM geometries
    `;

    // Sorting in SQL would sort the large geometry values too, which is slow and may spill to disk.
    rows.sort((a, b) => a.assetId - b.assetId || a.layerOrder - b.layerOrder || a.sortId - b.sortId);

    const result: ExportGeometries = { geometries: [], skipped: [] };
    for (const row of rows) {
      const id = row.id as GeometryId;
      if (row.wkb === null || row.minX === null || row.maxX === null || row.minY === null || row.maxY === null) {
        result.skipped.push({ id, assetId: row.assetId });
        continue;
      }
      result.geometries.push({
        id,
        assetId: row.assetId,
        layer: row.layer,
        geometryType: row.geometryType ?? '',
        srid: row.srid ?? 0,
        wkb: Buffer.from(row.wkb, 'base64'),
        envelope: { minX: row.minX, maxX: row.maxX, minY: row.minY, maxY: row.maxY },
      });
    }
    return result;
  }
}
