import {
  Asset,
  AssetData,
  AssetId,
  GeometryData,
  GeometryId,
  GeometryType,
  GeometryUpdate,
  mapGeometryTypeToStudyType,
  UserId,
} from '@asset-sg/shared/v2';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/core/prisma.service';
import { Repo, RepoListOptions } from '@/core/repo';
import { CreateAssetData } from '@/features/assets/asset.model';
import { FileRepo } from '@/features/assets/files/file.repo';
import {
  assetSelection,
  mapAssetDataToPrismaCreate,
  mapAssetDataToPrismaUpdate,
  parseAssetFromPrisma,
} from '@/features/assets/prisma-asset';
import { handlePrismaMutationError } from '@/utils/prisma';

@Injectable()
export class AssetRepo implements Repo<Asset, AssetId, CreateAssetData, AssetData> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileRepo: FileRepo,
  ) {}

  async count(): Promise<number> {
    return this.prisma.asset.count();
  }

  async find(id: AssetId): Promise<Asset | null> {
    const entry = await this.prisma.asset.findFirst({
      where: { assetId: id },
      select: assetSelection,
    });
    return entry == null ? null : parseAssetFromPrisma(entry);
  }

  async list({ limit, offset, ids }: RepoListOptions<AssetId> = {}): Promise<Asset[]> {
    const entries = await this.prisma.asset.findMany({
      where: ids == null ? undefined : { assetId: { in: ids } },
      take: limit,
      skip: offset,
      select: assetSelection,
    });
    return await Promise.all(entries.map((it) => parseAssetFromPrisma(it)));
  }

  async listFavoriteIds(userId: UserId): Promise<AssetId[]> {
    const entries = await this.prisma.asset.findMany({
      where: {
        favorites: {
          some: {
            userId: userId,
          },
        },
      },
      select: { assetId: true },
    });
    return entries.map((it) => it.assetId);
  }

  async create(data: CreateAssetData): Promise<Asset> {
    const id = await this.prisma.$transaction(async () => {
      const { assetId } = await this.prisma.asset.create({
        data: mapAssetDataToPrismaCreate(data),
        select: { assetId: true },
      });
      await this.manageGeometries(assetId, data.geometries);
      return assetId;
    });
    return (await this.find(id)) as Asset;
  }

  async update(id: AssetId, data: AssetData): Promise<Asset | null> {
    try {
      return await this.prisma.$transaction(async () => {
        await this.manageGeometries(id, data.geometries);
        const entry = await this.prisma.asset.update({
          where: { assetId: id },
          data: mapAssetDataToPrismaUpdate(id, data),
          select: assetSelection,
        });
        // TODO cleanup orphaned files. Should probably be done outside of this repo.
        return parseAssetFromPrisma(entry);
      });
    } catch (e) {
      return handlePrismaMutationError(e);
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.$transaction(async () => {
        // Delete the record's `file` records.
        const assetFileIds = await this.prisma.assetFile.findMany({
          where: { assetId: id },
          select: { fileId: true },
        });

        for (const { fileId } of assetFileIds) {
          await this.fileRepo.delete({ id: fileId, assetId: id });
        }

        // Delete the record.
        await this.prisma.asset.delete({ where: { assetId: id } });

        // Delete all `WorkflowSelection` records that are not in use anymore.
        await this.prisma.workflowSelection.deleteMany({
          where: {
            reviewWorkflow: null,
            approvalWorkflow: null,
          },
        });
      });
      return true;
    } catch (e) {
      return handlePrismaMutationError(e) ?? false;
    }
  }

  private async manageGeometries(assetId: AssetId, data: Array<GeometryUpdate | GeometryData>): Promise<void> {
    const geometriesToCreate = new Map<GeometryType, GeometryData[]>();
    const geometriesToUpdate = new Map<GeometryType, GeometryUpdate[]>();

    const enter = <T extends GeometryUpdate | GeometryData>(mapping: Map<GeometryType, T[]>, entry: T): void => {
      const entries = mapping.get(entry.type);
      if (entries === undefined) {
        mapping.set(entry.type, [entry]);
      } else {
        entries.push(entry);
      }
    };

    for (const entry of data) {
      if ('id' in entry) {
        enter(geometriesToUpdate, entry);
      } else {
        enter(geometriesToCreate, entry);
      }
    }
    for (const [type, updates] of geometriesToUpdate) {
      await this.deleteGeometries(assetId, { type, excludedIds: updates.map((it) => it.id) });
      await this.updateGeometries(assetId, { type, updates });
    }
    for (const [type, geometries] of geometriesToCreate) {
      await this.createGeometries(assetId, { type, geometries });
    }
  }

  private async deleteGeometries(
    assetId: AssetId,
    options: { type: GeometryType; excludedIds: GeometryId[] },
  ): Promise<void> {
    const studyType = mapGeometryTypeToStudyType(options.type);
    const condition =
      options.excludedIds.length === 0
        ? ''
        : Prisma.sql`AND study_${Prisma.raw(studyType)}_id NOT IN (${Prisma.join(options.excludedIds, ',')})`;
    await this.prisma.$queryRaw`
        DELETE
        FROM public.study_${studyType}
        WHERE assetId = ${assetId} ${condition}
    `;
  }

  private async createGeometries(
    assetId: AssetId,
    { type, geometries }: { type: GeometryType; geometries: GeometryData[] },
  ): Promise<void> {
    if (geometries.length === 0) {
      return;
    }
    const studyType = mapGeometryTypeToStudyType(type);
    const values = geometries.map(
      (geometry) => Prisma.sql`
      (${assetId}, st_geomfromtext('${geometry.geometry}', 2056))
    `,
    );
    await this.prisma.$queryRaw`
        INSERT INTO public.study_${studyType}
            (asset_id, geom)
        VALUES
            ${Prisma.join(values, ',')}
    `;
  }

  private async updateGeometries(
    assetId: AssetId,
    { type, updates }: { type: GeometryType; updates: GeometryUpdate[] },
  ): Promise<void> {
    if (updates.length === 0) {
      return;
    }
    const studyType = mapGeometryTypeToStudyType(type);
    const cases = updates.map(
      (update) => Prisma.sql`
      WHEN study_${Prisma.raw(studyType)}_id = ${update.id}
      THEN ${update.geometry}
    `,
    );
    await this.prisma.$queryRaw`
        UPDATE
            public.study_${studyType}
        SET geom =
                CASE
                    ${Prisma.join(cases, '\n')}
                    ELSE geom
        WHERE assetId = ${assetId}
    `;
  }
}
