import {
  Asset,
  AssetContactRole,
  AssetSearchResult,
  AssetSearchResultItem,
  AssetSearchStats,
  AssetSearchUsageCode,
  ElasticsearchAsset,
  LanguageCode,
  LocalDate,
  PageStats,
} from '@asset-sg/shared/v2';
import { faker } from '@faker-js/faker';

// eslint-disable-next-line @nx/enforce-module-boundaries
import indexMapping from '../../../../../../development/init/elasticsearch/mappings/swissgeol_asset_asset.json';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { assetKindItems } from '../../../../../../test/data/asset-kind-item';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { languageItems } from '../../../../../../test/data/language-items';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { manCatLabelItems } from '../../../../../../test/data/man-cat-label-item';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { clearPrismaAssets, setupDB } from '../../../../../../test/setup-db';

import { AssetRepo } from '../asset.repo';
import { ASSET_ELASTIC_INDEX, AssetSearchService } from './asset-search.service';

import { openElasticsearchClient } from '@/core/elasticsearch';
import { PrismaService } from '@/core/prisma.service';
import { fakeContact, fakeCreateAssetData, fakeUserData } from '@/features/assets/asset.fake';
import { CreateAssetDataWithCreator } from '@/features/assets/asset.model';
import { FileRepo } from '@/features/assets/files/file.repo';
import { GeometryDetailRepo } from '@/features/geometries/geometry-detail.repo';
import { GeometryRepo } from '@/features/geometries/geometry.repo';
import { UserRepo } from '@/features/users/user.repo';

describe(AssetSearchService, () => {
  const elastic = openElasticsearchClient();
  const prisma = new PrismaService();
  const fileRepo = new FileRepo(prisma);
  const assetRepo = new AssetRepo(prisma, fileRepo);
  const geometryRepo = new GeometryRepo(prisma);
  const geometryDetailRepo = new GeometryDetailRepo(prisma);
  const userRepo = new UserRepo(prisma);
  const service = new AssetSearchService(elastic, prisma, assetRepo, geometryRepo, geometryDetailRepo);

  beforeAll(async () => {
    const existsIndex = await elastic.indices.exists({ index: ASSET_ELASTIC_INDEX });
    if (!existsIndex) {
      await elastic.indices.create({ index: ASSET_ELASTIC_INDEX });
      await elastic.indices.putMapping({
        index: ASSET_ELASTIC_INDEX,
        ...indexMapping,
      });
    }

    await setupDB(prisma);
  });

  beforeEach(async () => {
    await clearPrismaAssets(prisma);
    await elastic.deleteByQuery({
      index: ASSET_ELASTIC_INDEX,
      query: { match_all: {} },
      refresh: true,
    });
  });

  const create = async (data: CreateAssetDataWithCreator): Promise<Asset> => {
    const asset = await assetRepo.create(data);
    await service.register(asset);
    return asset;
  };

  const createItem = async (data: CreateAssetDataWithCreator): Promise<AssetSearchResultItem> => {
    const asset = await create(data);
    return {
      id: asset.id,
      title: asset.title,
      isPublic: asset.isPublic,
      formatCode: asset.formatCode,
      kindCode: asset.kindCode,
      topicCodes: asset.topicCodes,
      contacts: asset.contacts,
      createdAt: asset.createdAt,
      geometries: [],
    };
  };

  const assertHit = (hit: ElasticsearchAsset, asset: Asset): void => {
    expect(hit.id).toEqual(asset.id);
    expect(hit.title).toEqual(asset.title);
    expect(hit.originalTitle).toEqual(asset.originalTitle);
    expect(hit.sgsId).toEqual(asset.legacyData?.sgsId ?? null);
    expect(hit.createdAt).toEqual(asset.createdAt.toString());
    expect(hit.kindCode).toEqual(asset.kindCode);
    expect(hit.usageCode).toEqual(asset.isPublic ? AssetSearchUsageCode.Public : AssetSearchUsageCode.Internal);
    expect(hit.authorIds).toEqual([]);
    expect(hit.contactNames).toEqual([]);
    expect(hit.topicCodes).toEqual([]);

    const languageCodes = asset.languageCodes.length === 0 ? ['None'] : asset.languageCodes;
    expect(hit.languageCodes).toEqual(languageCodes);
  };

  describe('register', () => {
    it('adds an asset to elasticsearch', async () => {
      // Given
      const asset = await assetRepo.create({
        ...fakeCreateAssetData(),
        creatorId: (await userRepo.create(fakeUserData())).id,
      });

      // When
      await service.register(asset);

      // Then
      const response = await elastic.search({
        index: ASSET_ELASTIC_INDEX,
        size: 10_000,
        _source: true,
      });
      expect(response.hits.hits.length).toEqual(1);

      const hit = response.hits.hits[0]._source as ElasticsearchAsset;
      assertHit(hit, asset);
    });
  });

  describe('deleteFromIndex', () => {
    it('deletes an an asset from elastic search', async () => {
      // Given
      const asset = await assetRepo.create({
        ...fakeCreateAssetData(),
        creatorId: (await userRepo.create(fakeUserData())).id,
      });
      await service.register(asset);

      // When
      await service.deleteFromIndex(asset.id);

      const response = await elastic.search({
        index: ASSET_ELASTIC_INDEX,
        size: 10_000,
        _source: true,
      });
      //Then
      expect(response.hits.hits.length).toEqual(0);
    });
  });

  describe('search', () => {
    const assertSingleResult = (result: AssetSearchResult, asset: AssetSearchResultItem): void => {
      expect(result.page).toEqual({ total: 1, size: 1, offset: 0 } as PageStats);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(asset);
    };

    const testSearchInProperty =
      <T extends string | number>(
        text: T,
        setup: (
          asset: CreateAssetDataWithCreator,
          text: T,
        ) => CreateAssetDataWithCreator | Promise<CreateAssetDataWithCreator>,
      ) =>
      async () => {
        // Given
        const user = await userRepo.create(fakeUserData());
        const data = await setup({ ...fakeCreateAssetData(), creatorId: user.id }, text);
        const asset = await createItem(data);
        await createItem({ ...fakeCreateAssetData(), creatorId: user.id });

        // When
        const result = await service.search({ text: `${text}` }, user);

        // Then
        assertSingleResult(result, asset);
      };

    const millisPerDay = 1000 * 60 * 60 * 24;

    it(
      'finds text in title',
      testSearchInProperty(faker.string.uuid(), (asset, text) => ({
        ...asset,
        title: text,
      })),
    );

    it(
      'finds text in originalTitle',
      testSearchInProperty(faker.string.uuid(), (asset, text) => ({
        ...asset,
        originalTitle: text,
      })),
    );

    const contactData = fakeContact();
    it(
      'finds text in contactNames',
      testSearchInProperty(contactData.name, async (asset) => {
        const { kindCode, ...data } = contactData;
        const contact = await prisma.contact.create({
          data: {
            ...data,
            contactKindItemCode: kindCode,
          },
        });
        return {
          ...asset,
          contacts: [{ id: contact.contactId, role: AssetContactRole.Author }],
        };
      }),
    );

    it('finds assets by minimum createdAt', async () => {
      // Given
      const user = await userRepo.create(fakeUserData());
      const asset = await createItem({ ...fakeCreateAssetData(), creatorId: user.id });
      await createItem({
        ...fakeCreateAssetData(),
        createdAt: LocalDate.fromDate(new Date(asset.createdAt.toDate().getTime() - millisPerDay * 2)),
        creatorId: user.id,
      });

      // When
      const result = await service.search(
        {
          createdAt: {
            min: LocalDate.fromDate(new Date(asset.createdAt.toDate().getTime() - millisPerDay)),
          },
        },
        user,
      );

      // Then
      assertSingleResult(result, asset);
    });

    it('finds assets by maximum createdAt', async () => {
      // Given
      const user = await userRepo.create(fakeUserData());
      const asset = await createItem({ ...fakeCreateAssetData(), creatorId: user.id });
      await createItem({
        ...fakeCreateAssetData(),
        createdAt: LocalDate.fromDate(new Date(asset.createdAt.toDate().getTime() + millisPerDay * 2)),
        creatorId: user.id,
      });

      // When
      const result = await service.search(
        {
          createdAt: {
            max: LocalDate.fromDate(new Date(asset.createdAt.toDate().getTime() + millisPerDay)),
          },
        },
        user,
      );

      // Then
      assertSingleResult(result, asset);
    });

    it('finds assets by createdAt range', async () => {
      // Given
      const asset = await createItem({
        ...fakeCreateAssetData(),
        creatorId: (await userRepo.create(fakeUserData())).id,
      });
      await createItem({
        ...fakeCreateAssetData(),
        createdAt: LocalDate.fromDate(new Date(asset.createdAt.toDate().getTime() + millisPerDay * 2)),
        creatorId: (await userRepo.create(fakeUserData())).id,
      });
      await createItem({
        ...fakeCreateAssetData(),
        createdAt: LocalDate.fromDate(new Date(asset.createdAt.toDate().getTime() - millisPerDay * 2)),
        creatorId: (await userRepo.create(fakeUserData())).id,
      });
      const user = await userRepo.create(fakeUserData());

      // When
      const result = await service.search(
        {
          createdAt: {
            min: LocalDate.fromDate(new Date(asset.createdAt.toDate().getTime() - millisPerDay)),
            max: LocalDate.fromDate(new Date(asset.createdAt.toDate().getTime() + millisPerDay)),
          },
        },
        user,
      );

      // Then
      assertSingleResult(result, asset);
    });

    it('finds assets by languageCode', async () => {
      // Given
      const code1 = languageItems[0].languageItemCode as LanguageCode;
      const code2 = languageItems[1].languageItemCode as LanguageCode;
      const code3 = languageItems[2].languageItemCode as LanguageCode;
      const asset = await createItem({
        ...fakeCreateAssetData(),
        languageCodes: [code1],
        creatorId: (await userRepo.create(fakeUserData())).id,
      });
      await createItem({
        ...fakeCreateAssetData(),
        languageCodes: [code2],
        creatorId: (await userRepo.create(fakeUserData())).id,
      });
      await createItem({
        ...fakeCreateAssetData(),
        languageCodes: [code3],
        creatorId: (await userRepo.create(fakeUserData())).id,
      });
      const user = await userRepo.create(fakeUserData());

      // When
      const result = await service.search({ languageCodes: [code1] }, user);

      // Then
      assertSingleResult(result, asset);
    });

    it('finds assets by kindCode', async () => {
      // Given
      const code1 = assetKindItems[0].assetKindItemCode;
      const code2 = assetKindItems[1].assetKindItemCode;
      const code3 = assetKindItems[2].assetKindItemCode;
      const user = await userRepo.create(fakeUserData());
      const asset = await createItem({
        ...fakeCreateAssetData(),
        kindCode: code1,
        creatorId: user.id,
      });
      await createItem({ ...fakeCreateAssetData(), kindCode: code2, creatorId: user.id });
      await createItem({ ...fakeCreateAssetData(), kindCode: code3, creatorId: user.id });

      // When
      const result = await service.search({ kindCodes: [code1] }, user);

      // Then
      assertSingleResult(result, asset);
    });

    it('finds assets by topicCode', async () => {
      // Given
      const code1 = manCatLabelItems[0].manCatLabelItemCode;
      const code2 = manCatLabelItems[1].manCatLabelItemCode;
      const code3 = manCatLabelItems[2].manCatLabelItemCode;
      const user = await userRepo.create(fakeUserData());
      const asset = await createItem({
        ...fakeCreateAssetData(),
        topicCodes: [code1],
        creatorId: user.id,
      });
      await createItem({ ...fakeCreateAssetData(), topicCodes: [code2], creatorId: user.id });
      await createItem({ ...fakeCreateAssetData(), topicCodes: [code3], creatorId: user.id });

      // When
      const result = await service.search({ topicCodes: [code1] }, user);

      // Then
      assertSingleResult(result, asset);
    });

    it('finds assets by usageCode', async () => {
      // Given
      const usageCode = AssetSearchUsageCode.Public;
      const user = await userRepo.create(fakeUserData());
      const asset = await createItem({
        ...fakeCreateAssetData(),
        isPublic: true,
        creatorId: user.id,
      });
      await createItem({
        ...fakeCreateAssetData(),
        isPublic: false,
        creatorId: user.id,
      });

      // When
      const result = await service.search({ usageCodes: [usageCode] }, user);

      // Then
      assertSingleResult(result, asset);
    });

    it('finds assets by authorId', async () => {
      // Given
      const { kindCode: kindCode1, ...data1 } = fakeContact();
      const contact1 = await prisma.contact.create({
        data: {
          ...data1,
          contactKindItemCode: kindCode1,
        },
      });

      const { kindCode: kindCode2, ...data2 } = fakeContact();
      const contact2 = await prisma.contact.create({
        data: {
          ...data2,
          contactKindItemCode: kindCode2,
        },
      });

      const user = await userRepo.create(fakeUserData());
      const asset = await createItem({
        ...fakeCreateAssetData(),
        contacts: [{ id: contact1.contactId, role: AssetContactRole.Author }],
        creatorId: user.id,
      });
      await createItem({
        ...fakeCreateAssetData(),
        contacts: [{ id: contact1.contactId, role: AssetContactRole.Supplier }],
        creatorId: user.id,
      });
      await createItem({
        ...fakeCreateAssetData(),
        contacts: [{ id: contact2.contactId, role: AssetContactRole.Author }],
        creatorId: user.id,
      });

      // When
      const result = await service.search({ authorId: contact1.contactId }, user);

      // Then
      assertSingleResult(result, asset);
    });
  });

  describe('aggregate', () => {
    const assertSingleStats = (stats: AssetSearchStats, asset: Asset): void => {
      expect(stats).not.toBeNull();
      expect(stats.kindCodes).toEqual([
        {
          value: asset.kindCode,
          count: 1,
        },
      ]);
      expect(stats.languageCodes).toEqual(
        asset.languageCodes.length === 0
          ? [
              {
                count: 1,
                value: 'None',
              },
            ]
          : asset.languageCodes.map((it) => ({
              value: it,
              count: 1,
            })),
      );
      expect(stats.usageCodes).toEqual([
        {
          value: asset.isPublic ? AssetSearchUsageCode.Public : AssetSearchUsageCode.Internal,
          count: 1,
        },
      ]);
      expect(stats.createdAt).toEqual({
        min: asset.createdAt,
        max: asset.createdAt,
      });
      expect(stats.authorIds).toEqual(
        asset.contacts.filter((it) => it.role === AssetContactRole.Author).map((it) => ({ value: it.id, count: 1 })),
      );
      expect(stats.topicCodes).toEqual(asset.topicCodes.map((it) => ({ value: it, count: 1 })));
    };

    it('returns empty stats when no assets are present', async () => {
      // Given
      const user = await userRepo.create(fakeUserData());

      // When
      const result = await service.aggregate({}, user);

      // Then
      expect(result.total).toEqual(0);
      expect(result.authorIds).toHaveLength(0);
      expect(result.kindCodes).toHaveLength(0);
      expect(result.languageCodes).toHaveLength(0);
      expect(result.usageCodes).toHaveLength(0);
      expect(result.topicCodes).toHaveLength(0);
      expect(result.createdAt).toBeNull();
    });

    it('aggregates stats for a single asset', async () => {
      // Given
      const user = await userRepo.create(fakeUserData());
      const asset = await create({ ...fakeCreateAssetData(), creatorId: user.id });

      // When
      const result = await service.aggregate({}, user);

      // Then
      assertSingleStats(result, asset);
    });
  });

  describe('syncWithDatabase', () => {
    it('removes old documents', async () => {
      // When
      await service.syncWithDatabase();

      // Then
      const response = await elastic.search({
        index: ASSET_ELASTIC_INDEX,
        size: 10_000,
        _source: true,
      });
      expect(response.hits.hits.length).toEqual(0);
    });

    it('writes assets to Elasticsearch', async () => {
      // Given
      const asset1 = await assetRepo.create({
        ...fakeCreateAssetData(),
        creatorId: (await userRepo.create(fakeUserData())).id,
      });
      const asset2 = await assetRepo.create({
        ...fakeCreateAssetData(),
        creatorId: (await userRepo.create(fakeUserData())).id,
      });
      const asset3 = await assetRepo.create({
        ...fakeCreateAssetData(),
        creatorId: (await userRepo.create(fakeUserData())).id,
      });

      // When
      await service.syncWithDatabase();

      // Then
      const response = await elastic.search({
        index: ASSET_ELASTIC_INDEX,
        size: 10_000,
        sort: {
          id: 'asc',
        },
        _source: true,
      });
      expect(response.hits.hits.length).toEqual(3);

      const hit1 = response.hits.hits[0]._source as ElasticsearchAsset;
      assertHit(hit1, asset1);

      const hit2 = response.hits.hits[1]._source as ElasticsearchAsset;
      assertHit(hit2, asset2);

      const hit3 = response.hits.hits[2]._source as ElasticsearchAsset;
      assertHit(hit3, asset3);
    });

    it('reports final progress when no assets were synced', async () => {
      // When
      const progress: number[] = [];
      await service.syncWithDatabase((percentage) => {
        progress.push(percentage);
      });

      // Then
      expect(progress).toEqual([1]);
    });
  });
});
