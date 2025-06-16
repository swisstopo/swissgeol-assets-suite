import {
  Asset,
  AssetContactRole,
  AssetId,
  AssetSchema,
  ContactId,
  convert,
  ElasticsearchAsset,
  GeometryId,
  GeometryType,
  UserId,
} from '@asset-sg/shared/v2';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { BulkOperationContainer } from '@elastic/elasticsearch/lib/api/types';
import { PrismaClient } from '@prisma/client';
import { mapLv95ToElastic } from '@/features/assets/search/asset-search.utils';
import { GeometryRepo } from '@/features/geometries/geometry.repo';
import { ProcessQueue } from '@/utils/process-queue';

const QUEUE_SIZE = 10;

export interface AssetSearchWriterOptions {
  index: string;
  shouldRefresh?: boolean;
  isEager?: boolean;
}

export class AssetSearchWriter {
  private readonly eager: Promise<Eager | null>;

  constructor(
    private readonly elastic: ElasticsearchClient,
    private readonly prisma: PrismaClient,
    private readonly geometryRepo: GeometryRepo,
    private readonly options: AssetSearchWriterOptions,
  ) {
    this.eager = options.isEager ? this.fetchEager() : Promise.resolve(null);
  }

  async write(oneOrMore: Asset | Asset[]): Promise<void> {
    const assets = Array.isArray(oneOrMore) ? oneOrMore : [oneOrMore];
    const operations: Array<BulkOperationContainer | ElasticsearchAsset> = Array(assets.length * 2);

    const processQueue = new ProcessQueue(QUEUE_SIZE);
    for (let j = 0; j < assets.length; j++) {
      const i = j;
      const asset = assets[i];
      processQueue
        .add(async () => {
          const elasticAsset = await this.mapAssetToElastic(asset);
          operations[i * 2] = { index: { _index: this.options.index, _id: `${elasticAsset.id}` } };
          operations[i * 2 + 1] = elasticAsset;
        })
        .then();
    }
    await processQueue.waitForIdle();

    await this.elastic.bulk({
      index: this.options.index,
      refresh: this.options.shouldRefresh,
      operations,
    });
  }

  private async mapAssetToElastic(asset: Asset): Promise<ElasticsearchAsset> {
    const contactNamesPromise = this.fetchContactNamesForAsset(asset);
    const favoredByUsersPromise = this.fetchFavoredByUserIdsForAsset(asset);
    const geometryTypesPromise = this.fetchGeometryTypesForAsset(asset);
    const locationsPromise = this.fetchLocationsForAsset(asset);

    const languageCodes = asset.languageCodes.length === 0 ? ['None'] : asset.languageCodes;

    return {
      id: asset.id,
      title: asset.title,
      originalTitle: asset.originalTitle,
      sgsId: asset.legacyData?.sgsId ?? null,
      createdAt: asset.createdAt.toDate(),
      kindCode: asset.kindCode,
      languageCodes,
      authorIds: asset.contacts.filter((it) => it.role === AssetContactRole.Author).map((it) => it.id),
      contactNames: await contactNamesPromise,
      topicCodes: asset.topicCodes,
      geometryTypes: await geometryTypesPromise,
      locations: await locationsPromise,
      workgroupId: asset.workgroupId,
      favoredByUserIds: await favoredByUsersPromise,
      data: JSON.stringify(convert(AssetSchema, asset)),
    };
  }

  private async fetchContactNamesForAsset(asset: Asset): Promise<string[]> {
    const eager = await this.eager;
    if (eager !== null) {
      const names: string[] = [];
      for (const contact of asset.assetContacts) {
        const name = eager.contactIdToName.get(contact.contactId);
        if (name !== undefined) {
          names.push(name);
        }
      }
      return names;
    }
    const contacts = await this.prisma.contact.findMany({
      select: {
        name: true,
      },
      where: {
        contactId: { in: asset.assetContacts.map((it) => it.contactId) },
      },
    });
    return contacts.map((it) => it.name);
  }

  private async fetchFavoredByUserIdsForAsset(asset: Asset): Promise<string[]> {
    const eager = await this.eager;
    if (eager !== null) {
      return eager.assetIdToFavoredByUserId.get(asset.assetId) ?? [];
    }
    const favoredByUsers = await this.prisma.assetUser.findMany({
      select: {
        id: true,
      },
      where: {
        favorites: {
          some: {
            assetId: asset.assetId,
          },
        },
      },
    });
    return favoredByUsers.map(({ id }) => id);
  }

  private async fetchGeometryTypesForAsset(asset: Asset): Promise<GeometryType[] | ['None']> {
    const geometryCodes: GeometryCode[] = [];
    for (const study of asset.studies) {
      const geometryCode = (() => {
        const prefix = study.geomText.split('(', 2)[0];
        switch (prefix) {
          case 'POINT':
            return GeometryCode.Point;
          case 'POLYGON':
            return GeometryCode.Polygon;
          case 'LINESTRING':
            return GeometryCode.LineString;
          default:
            throw new Error(`unknown geomText prefix: ${prefix} for asset ${asset.assetId}`);
        }
      })();
      geometryCodes.push(geometryCode);
    }
    return geometryCodes.length > 0 ? [...new Set(geometryCodes)] : ['None'];
  }

  private async fetchLocationsForAsset(asset: Asset): Promise<ElasticPoint[]> {
    const studyLocations: ElasticPoint[] = [];
    for (const study of asset.studies) {
      const fullStudy = await this.geometryRepo.find(study.studyId as GeometryId);
      if (fullStudy != null) {
        studyLocations.push(mapLv95ToElastic(fullStudy.center));
      }
    }
    return studyLocations;
  }

  private async fetchEager(): Promise<Eager> {
    const [contacts, favorites] = await Promise.all([this.fetchEagerContacts(), this.fetchEagerFavorites()] as const);
    return {
      contactIdToName: contacts,
      assetIdToFavoredByUserId: favorites,
    };
  }

  private async fetchEagerContacts(): Promise<Map<ContactId, string>> {
    const contacts = await this.prisma.contact.findMany({
      select: {
        contactId: true,
        name: true,
      },
    });
    const mapping = new Map<ContactId, string>();
    for (const { contactId, name } of contacts) {
      mapping.set(contactId, name);
    }
    return mapping;
  }

  private async fetchEagerFavorites(): Promise<Map<AssetId, UserId[]>> {
    const favorites = await this.prisma.favorite.findMany({
      select: {
        assetId: true,
        userId: true,
      },
    });
    const mapping = new Map<AssetId, UserId[]>();
    for (const { assetId, userId } of favorites) {
      const userIds = mapping.get(assetId);
      if (userIds === undefined) {
        mapping.set(assetId, [userId]);
      } else {
        userIds.push(userId);
      }
    }
    return mapping;
  }
}

interface Eager {
  contactIdToName: Map<ContactId, string>;
  assetIdToFavoredByUserId: Map<AssetId, UserId[]>;
}
