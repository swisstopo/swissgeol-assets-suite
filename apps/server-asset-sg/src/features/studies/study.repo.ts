import { LV95, LV95FromSpaceSeparatedString, parseLV95 } from '@asset-sg/shared';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as E from 'fp-ts/Either';
import { PrismaService } from '@/core/prisma.service';
import { ReadRepo, RepoListOptions } from '@/core/repo';
import { Study, StudyId } from '@/features/studies/study.model';

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

  list({ limit, offset, ids }: RepoListOptions<StudyId> = {}): Promise<Study[]> {
    const conditions: Prisma.Sql[] = [];
    if (ids != null && ids.length > 0) {
      conditions.push(Prisma.sql`
        WHERE study_id IN (${Prisma.join(ids, ',')})
      `);
    }
    conditions.push(Prisma.sql`
      ORDER BY asset_id
    `);
    if (limit != null) {
      conditions.push(Prisma.sql`
        LIMIT ${limit}
      `);
    }
    if (offset != null && offset !== 0) {
      conditions.push(Prisma.sql`
        OFFSET ${offset}
      `);
    }
    return this.query(Prisma.join(conditions, ' '));
  }

  private async query(condition: Prisma.Sql): Promise<Study[]> {
    type RawStudy = Omit<Study, 'center'> & { center: string };
    const studies: RawStudy[] = await this.prisma.$queryRaw`
      SELECT
        study_id as "id",
        asset_id AS "assetId",
        is_point AS "isPoint",
        SUBSTRING(centroid_geom_text FROM 7 FOR length(centroid_geom_text) -7) AS "center"
      FROM public.all_study
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
