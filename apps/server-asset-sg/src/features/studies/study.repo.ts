import { parseLV95 } from '@asset-sg/shared';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/core/prisma.service';
import { ReadRepo, RepoListOptions } from '@/core/repo';
import { Study, StudyId } from '@/features/studies/study.model';
import { WorkgroupId } from '@/features/workgroups/workgroup.model';

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
    if (conditions.length != null) {
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
    type RawStudy = Omit<Study, 'center'> & { center: string };
    const studies: RawStudy[] = await this.prisma.$queryRaw`
      SELECT
        s.study_id as "id",
        s.asset_id AS "assetId",
        s.is_point AS "isPoint",
        SUBSTRING(s.centroid_geom_text FROM 7 FOR length(s.centroid_geom_text) -7) AS "center"
      FROM public.all_study s
      ${condition}
    `;
    return studies.map((study) => {
      return {
        ...study,
        center: parseLV95(study.center, { separator: ' ' }),
      };
    });
  }
}

interface ListOptions extends RepoListOptions<StudyId> {
  workgroupIds?: WorkgroupId[] | null;
}
