import { GeometryDetail, GeometryType } from '@asset-sg/shared/v2';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/core/prisma.service';
import { GeometryBaseRepo } from '@/features/geometries/geometry-base.repo';
import { parseLongGeometryIdToGeometryId } from '@/features/geometries/geometry.repo';

@Injectable()
export class GeometryDetailRepo extends GeometryBaseRepo<GeometryDetail> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected async query(condition: Prisma.Sql): Promise<GeometryDetail[]> {
    type RawStudy = Omit<GeometryDetail, 'coordinates' | 'type'> & { geomJson: string; centroidJson: string };
    const studies: RawStudy[] = await this.prisma.$queryRaw`
        SELECT s.study_id       AS "id",
               ST_AsGeoJSON(ST_GeomFromText(s.geom_text)) AS "geomJson",
               ST_AsGeoJSON(ST_CENTROID(s.geom_text)) AS "centroidJson"
        FROM public.all_study s
            ${condition}
    `;

    return studies.map((study) => {
      const json: { type: GeometryType; coordinates: unknown[] } = JSON.parse(study.geomJson);
      const centroid = JSON.parse(study.centroidJson) as { type: GeometryType.Point; coordinates: [number, number] };
      const coordinates = (() => {
        switch (json.type) {
          case GeometryType.Point:
            return [json.coordinates as [number, number]];
          case GeometryType.LineString:
            return json.coordinates as Array<[number, number]>;
          case GeometryType.Polygon:
            return (json.coordinates as Array<Array<[number, number]>>)[0];
        }
      })();
      return {
        id: parseLongGeometryIdToGeometryId(study.id),
        type: json.type,
        coordinates: coordinates.map(([y, x]) => ({ x, y })),
        // NB: rounding to integer, as 1 meter precision is enough for the current app use cases
        centroid: { x: Math.round(centroid.coordinates[1]), y: Math.round(centroid.coordinates[0]) },
      };
    });
  }
}
