import { Geometry, GeometryAccessType, GeometryType } from '@asset-sg/shared/v2';
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

    // We round coordinates to 2 digits, since that represents centimetre accuracy which is more than enough. The casts
    // are required because Prisma treats numeric as Decimal, which we can ignore for the sake of this accuracy
    const studies: RawStudy[] = await this.prisma.$queryRaw`
        SELECT s.study_id       AS "id",
               s.geometry_type  AS "type",
               ROUND(ST_X(s.centroid)::numeric, 2)::double precision AS "centerX",
               ROUND(ST_Y(s.centroid)::numeric, 2)::double precision AS "centerY",
               s.is_public      AS "isPublic",
               s.asset_id       AS "assetId"
        FROM public.all_study s
            ${condition}
    `;
    return studies.map((study) => {
      return {
        id: parseId(study.id),
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
 * todo: this should be done on the db side to reduce view size there diretly
 * @param id
 */
const parseId = (id: string) => {
  if (id.startsWith('study_area_')) {
    return id.replace('study_area_', 'a');
  }
  if (id.startsWith('study_location_')) {
    return id.replace('study_location_', 'l');
  }
  if (id.startsWith('study_trace_')) {
    return id.replace('study_trace_', 't');
  }
  console.log(id);
  throw new Error('Unknown type');
};
