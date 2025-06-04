import { GeometryDetail } from '@asset-sg/shared/v2';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/core/prisma.service';
import { GeometryBaseRepo } from '@/features/geometries/geometry-base.repo';

@Injectable()
export class GeometryDetailRepo extends GeometryBaseRepo<GeometryDetail> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected async query(condition: Prisma.Sql): Promise<GeometryDetail[]> {
    type RawStudy = Omit<GeometryDetail, 'coordinates'> & { geomJson: string };
    const studies: RawStudy[] = await this.prisma.$queryRaw`
        SELECT s.study_id       AS "id",
               s.geometry_type  AS "type",
               ST_AsGeoJSON(ST_GeomFromText(s.geom_text)) AS "geomJson"
        FROM public.all_study s
            ${condition}
    `;
    return studies.map((study) => {
      const json: { type: 'Point' | 'LineString' | 'Polygon'; coordinates: unknown[] } = JSON.parse(study.geomJson);
      const coordinates = (() => {
        switch (json.type) {
          case 'Point':
            return [json.coordinates as [number, number]];
          case 'LineString':
            return json.coordinates as Array<[number, number]>;
          case 'Polygon':
            return (json.coordinates as Array<Array<[number, number]>>)[0];
        }
      })();
      return {
        id: study.id,
        type: study.type,
        coordinates: coordinates.map(([y, x]) => ({ x, y })),
      };
    });
  }
}
