import { Geometry, GeometryAccessType, GeometryId, GeometryType } from '@asset-sg/shared/v2';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/core/prisma.service';
import { GeometryBaseRepo } from '@/features/geometries/geometry-base.repo';

@Injectable()
export class GeometryRepo extends GeometryBaseRepo<Geometry> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected async query(condition: Prisma.Sql): Promise<Geometry[]> {
    type RawStudy = Omit<Geometry, 'center' | 'isPublic' | 'type'> & {
      centerX: number;
      centerY: number;
      isPublic: boolean;
      type: 'Point' | 'Line' | 'Polygon';
    };
    const studies: RawStudy[] = await this.prisma.$queryRaw`
        SELECT s.study_id       AS "id",
               s.geometry_type  AS "type",
               -- NB: 1 meter precision is enough for the current app use cases
               ROUND(ST_X(s.centroid))::integer AS "centerX",
               ROUND(ST_Y(s.centroid))::integer AS "centerY",
               s.is_public      AS "isPublic",
               s.asset_id       AS "assetId"
        FROM public.all_study s
            ${condition}
    `;
    return studies.map((study) => {
      return {
        id: parseLongGeometryIdToGeometryId(study.id),
        type: study.type === 'Line' ? GeometryType.LineString : (study.type as GeometryType),
        assetId: study.assetId,

        // todo #553: fix reversed coordinates in frontend
        center: { y: study.centerX, x: study.centerY },
        accessType: study.isPublic ? GeometryAccessType.Public : GeometryAccessType.Internal,
      };
    });
  }
}

/**
 * Ideally, this would be stored in the database, but we do not have enough time for proper testing, so we do it here.
 * @param id
 */
export const parseLongGeometryIdToGeometryId = (id: string): GeometryId => {
  if (id.startsWith('study_area_')) {
    return `a${id.split('study_area_')[1]}` as GeometryId;
  }
  if (id.startsWith('study_location_')) {
    return `l${id.split('study_location_')[1]}` as GeometryId;
  }
  if (id.startsWith('study_trace_')) {
    return `t${id.split('study_trace_')[1]}` as GeometryId;
  }
  throw new Error('Unknown type');
};
