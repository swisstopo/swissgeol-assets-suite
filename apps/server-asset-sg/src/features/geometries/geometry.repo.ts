import { Geometry, GeometryAccessType } from '@asset-sg/shared/v2';
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
    type RawStudy = Omit<Geometry, 'center' | 'isPublic'> & { centerX: number; centerY: number; isPublic: boolean };
    const studies: RawStudy[] = await this.prisma.$queryRaw`
        SELECT s.study_id       AS "id",
               s.geometry_type  AS "type",
               ST_X(s.centroid) AS "centerX",
               ST_Y(s.centroid) AS "centerY",
               s.is_public      AS "isPublic",
               s.asset_id       AS "assetId"
        FROM public.all_study s
            ${condition}
    `;
    return studies.map((study) => {
      return {
        id: study.id,
        type: study.type,
        assetId: study.assetId,

        // todo #553: fix reversed coordinates in frontend
        center: { y: study.centerX, x: study.centerY },
        accessType: study.isPublic ? GeometryAccessType.Public : GeometryAccessType.Internal,
      };
    });
  }
}
