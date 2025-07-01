import {
  Asset,
  AssetId,
  CreateGeometryData,
  DeleteGeometryData,
  extractGeometryTypeFromId,
  GeometryData,
  GeometryId,
  GeometryMutationType,
  GeometryType,
  mapGeometryTypeToStudyType,
  parseGeometryIdNumber,
  UpdateAssetData,
  UpdateGeometryData,
  UserId,
} from '@asset-sg/shared/v2';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/core/prisma.service';
import { Repo, RepoListOptions } from '@/core/repo';
import { CreateAssetDataWithCreator } from '@/features/assets/asset.model';
import { FileRepo } from '@/features/assets/files/file.repo';
import {
  assetSelection,
  mapAssetDataToPrismaCreate,
  mapAssetDataToPrismaUpdate,
  parseAssetFromPrisma,
} from '@/features/assets/prisma-asset';
import { handlePrismaMutationError } from '@/utils/prisma';

@Injectable()
export class AssetRepo implements Repo<Asset, AssetId, CreateAssetDataWithCreator, UpdateAssetData> {
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

  async create(data: CreateAssetDataWithCreator): Promise<Asset> {
    const id = await this.prisma.$transaction(async () => {
      const { assetId } = await this.prisma.asset.create({
        data: mapAssetDataToPrismaCreate(data),
        select: { assetId: true },
      });
      await this.applyGeometryMutations(assetId, data.geometries);
      return assetId;
    });
    return (await this.find(id)) as Asset;
  }

  async update(id: AssetId, data: UpdateAssetData): Promise<Asset | null> {
    try {
      return await this.prisma.$transaction(async () => {
        await this.applyGeometryMutations(id, data.geometries);
        const entry = await this.prisma.asset.update({
          where: { assetId: id },
          data: mapAssetDataToPrismaUpdate(id, data),
          select: assetSelection,
        });
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

  private async applyGeometryMutations(assetId: AssetId, data: GeometryData[]): Promise<void> {
    const geometriesToCreate = new Map<GeometryType, CreateGeometryData[]>();
    const geometriesToUpdate = new Map<GeometryType, UpdateGeometryData[]>();
    const geometriesToDelete = new Map<GeometryType, DeleteGeometryData[]>();

    const addEntryToMapping = <T extends GeometryData>(
      mapping: Map<GeometryType, T[]>,
      entry: T,
      type: GeometryType,
    ): void => {
      const entries = mapping.get(type);
      if (entries === undefined) {
        mapping.set(type, [entry]);
      } else {
        entries.push(entry);
      }
    };

    for (const entry of data) {
      switch (entry.mutation) {
        case GeometryMutationType.Create:
          addEntryToMapping(geometriesToCreate, entry, entry.type);
          break;
        case GeometryMutationType.Update:
          addEntryToMapping(geometriesToUpdate, entry, extractGeometryTypeFromId(entry.id));
          break;
        case GeometryMutationType.Delete:
          addEntryToMapping(geometriesToDelete, entry, extractGeometryTypeFromId(entry.id));
          break;
      }
    }

    for (const [type, deletion] of geometriesToDelete) {
      await this.deleteGeometries(assetId, { type, ids: deletion.map((it) => it.id) });
    }
    for (const [type, updates] of geometriesToUpdate) {
      await this.updateGeometries(assetId, { type, updates });
    }
    for (const [type, geometries] of geometriesToCreate) {
      await this.createGeometries(assetId, { type, geometries });
    }
  }

  private async createGeometries(
    assetId: AssetId,
    { type, geometries }: { type: GeometryType; geometries: CreateGeometryData[] },
  ): Promise<void> {
    if (geometries.length === 0) {
      return;
    }
    const studyType = mapGeometryTypeToStudyType(type);
    const values = geometries.map(
      (geometry) => Prisma.sql`
      (${assetId}, ST_GeomFromText(${geometry.text}, 2056))
    `,
    );
    await this.prisma.$queryRaw`
        INSERT INTO public.study_${Prisma.raw(studyType)}
            (asset_id, geom)
        VALUES
            ${Prisma.join(values, ',')}
    `;
  }

  private async updateGeometries(
    assetId: AssetId,
    { type, updates }: { type: GeometryType; updates: UpdateGeometryData[] },
  ): Promise<void> {
    if (updates.length === 0) {
      return;
    }
    const studyType = mapGeometryTypeToStudyType(type);
    const cases = updates.map(
      (update) => Prisma.sql`
      WHEN study_${Prisma.raw(studyType)}_id = ${parseGeometryIdNumber(update.id)}
      THEN ST_GeomFromText (${update.text}, 2056)
    `,
    );
    await this.prisma.$queryRaw`
        UPDATE
            public.study_${Prisma.raw(studyType)}
        SET geom =
                CASE
                    ${Prisma.join(cases, '\n')}
                    ELSE geom
                END
        WHERE asset_id = ${assetId}
    `;
  }

  private async deleteGeometries(assetId: AssetId, options: { type: GeometryType; ids: GeometryId[] }): Promise<void> {
    if (options.ids.length === 0) {
      return;
    }
    const studyType = mapGeometryTypeToStudyType(options.type);
    const ids = options.ids.map(parseGeometryIdNumber);
    const condition =
      ids.length === 0 ? '' : Prisma.sql`AND study_${Prisma.raw(studyType)}_id IN (${Prisma.join(ids, ',')})`;
    await this.prisma.$queryRaw`
        DELETE
        FROM public.study_${Prisma.raw(studyType)}
        WHERE asset_id = ${assetId} ${condition}
    `;
  }
}
