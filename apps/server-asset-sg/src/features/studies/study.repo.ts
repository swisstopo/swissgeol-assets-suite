import { Study, StudyAccessType, StudyId, WorkgroupId } from '@asset-sg/shared/v2';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/core/prisma.service';
import { ReadRepo, RepoListOptions } from '@/core/repo';

@Injectable()
export class StudyRepo implements ReadRepo<Study, StudyId> {
  constructor(private readonly prisma: PrismaService) {}

  async find(id: StudyId): Promise<Study | null> {
    const result = await this.query(Prisma.sql`
      WHERE
        study_id = ${id}
      LIMIT 1
    `);
    return result.length === 1 ? result[0] : null;
  }

  list({ limit, offset, ids, workgroupIds }: ListOptions = {}): Promise<Study[]> {
    if (workgroupIds != null && workgroupIds.length === 0) {
      return Promise.resolve([]);
    }
    const parts: Prisma.Sql[] = [];
    const conditions: Prisma.Sql[] = [];
    if (workgroupIds != null) {
      parts.push(Prisma.sql`
        LEFT JOIN asset a ON a.asset_id = s.asset_id
      `);
      conditions.push(Prisma.sql`
        a.workgroup_id IN (${Prisma.join(workgroupIds, ',')})
      `);
    }
    if (ids != null && ids.length > 0) {
      conditions.push(Prisma.sql`
        s.study_id IN (${Prisma.join(ids, ',')})
      `);
    }
    if (conditions.length != 0) {
      parts.push(Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`);
    }
    parts.push(Prisma.sql`
      ORDER BY s.asset_id
    `);
    if (limit != null) {
      parts.push(Prisma.sql`
        LIMIT ${limit}
      `);
    }
    if (offset != null && offset !== 0) {
      parts.push(Prisma.sql`
        OFFSET ${offset}
      `);
    }
    return this.query(Prisma.join(parts, ' '));
  }

  private async query(condition: Prisma.Sql): Promise<Study[]> {
    type RawStudy = Omit<Study, 'center' | 'isPublic'> & { centerX: number; centerY: number; isPublic: boolean };
    const studies: RawStudy[] = await this.prisma.$queryRaw`
      SELECT s.study_id       AS "id",
             s.asset_id       AS "assetId",
             s.geometry_type  AS "geometryType",
             ST_X(s.centroid) AS "centerX",
             ST_Y(s.centroid) AS "centerY",
             s.is_public      AS "isPublic"
      FROM public.all_study s
        ${condition}
    `;
    return studies.map((study) => {
      return {
        ...study,
        // todo #553: fix reversed coordinates in frontend
        center: { y: study.centerX, x: study.centerY },
        accessType: this.parseAccessType(study.isPublic),
      };
    });
  }

  private parseAccessType(isPublic: boolean): StudyAccessType {
    return isPublic ? StudyAccessType.Public : StudyAccessType.Internal;
  }
}

interface ListOptions extends RepoListOptions<StudyId> {
  workgroupIds?: WorkgroupId[] | null;
}
