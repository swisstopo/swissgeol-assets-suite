import { AssetId, GeometryId, WorkgroupId } from '@asset-sg/shared/v2';
import { Prisma } from '@prisma/client';
import { ReadRepo, RepoListOptions } from '@/core/repo';

export abstract class GeometryBaseRepo<T> implements ReadRepo<T, GeometryId> {
  async find(id: GeometryId): Promise<T | null> {
    const result = await this.query(Prisma.sql`
      WHERE
        study_id = ${id}
      LIMIT 1
    `);
    return result.length === 1 ? result[0] : null;
  }

  list({ limit, offset, ids, workgroupIds, assetIds }: ListGeometryOptions = {}): Promise<T[]> {
    if ((workgroupIds != null && workgroupIds.length === 0) || (assetIds != null && assetIds.length === 0)) {
      // If any of the array filters is empty, the result will never contain any results.
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
    if (assetIds != null) {
      conditions.push(Prisma.sql`
        s.asset_id IN (${Prisma.join(assetIds, ',')})
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

  protected abstract query(condition: Prisma.Sql): Promise<T[]>;
}

export interface ListGeometryOptions extends RepoListOptions<GeometryId> {
  workgroupIds?: WorkgroupId[] | null;
  assetIds?: AssetId[] | null;
}
