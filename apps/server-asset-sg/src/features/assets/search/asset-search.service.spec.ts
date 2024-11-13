import {
  AssetEditDetail,
  AssetSearchResult,
  AssetSearchStats,
  dateFromDateId,
  dateIdFromDate,
  ElasticSearchAsset,
  makeUsageCode,
  PageStats,
  PatchAsset,
  SearchAsset,
  SearchAssetAggregations,
  SearchAssetResultNonEmpty,
  UsageCode,
} from '@asset-sg/shared';
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

import { ASSET_ELASTIC_INDEX, AssetSearchService } from './asset-search.service';

import { openElasticsearchClient } from '@/core/elasticsearch';
import { PrismaService } from '@/core/prisma.service';
import { fakeAssetPatch, fakeAssetUsage, fakeContact, fakeUser } from '@/features/asset-edit/asset-edit.fake';
import { AssetEditData, AssetEditRepo } from '@/features/asset-edit/asset-edit.repo';
import { FileRepo } from '@/features/files/file.repo';
import { StudyRepo } from '@/features/studies/study.repo';

describe(AssetSearchService, () => {
  const elastic = openElasticsearchClient();
  const prisma = new PrismaService();
  const fileRepo = new FileRepo(prisma);
  const assetRepo = new AssetEditRepo(prisma, fileRepo);
  const studyRepo = new StudyRepo(prisma);
  const service = new AssetSearchService(elastic, prisma, assetRepo, studyRepo);

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

  const create = async (data: AssetEditData): Promise<AssetEditDetail> => {
    const asset = await assetRepo.create(data);
    await service.register(asset);
    return asset;
  };

  const assertHit = (hit: ElasticSearchAsset, asset: AssetEditDetail): void => {
    expect(hit.assetId).toEqual(asset.assetId);
    expect(hit.titlePublic).toEqual(asset.titlePublic);
    expect(hit.titleOriginal).toEqual(asset.titleOriginal);
    expect(hit.sgsId).toEqual(asset.sgsId);
    expect(hit.createDate).toEqual(asset.createDate);
    expect(hit.assetKindItemCode).toEqual(asset.assetKindItemCode);
    expect(hit.usageCode).toEqual(makeUsageCode(asset.publicUse.isAvailable, asset.internalUse.isAvailable));
    expect(hit.authorIds).toEqual([]);
    expect(hit.contactNames).toEqual([]);
    expect(hit.manCatLabelItemCodes).toEqual([]);

    const languageItemCodes =
      asset.assetLanguages.length === 0 ? ['None'] : asset.assetLanguages.map((it) => it.languageItemCode);
    expect(hit.languageItemCodes).toEqual(languageItemCodes);
  };

  describe('register', () => {
    it('adds an asset to elasticsearch', async () => {
      // Given
      const asset = await assetRepo.create({ patch: fakeAssetPatch(), user: fakeUser() });

      // When
      await service.register(asset);

      // Then
      const response = await elastic.search({
        index: ASSET_ELASTIC_INDEX,
        size: 10_000,
        _source: true,
      });
      expect(response.hits.hits.length).toEqual(1);

      const hit = response.hits.hits[0]._source as ElasticSearchAsset;
      assertHit(hit, asset);
    });
  });

  describe('deleteFromIndex', () => {
    it('deletes an an asset from elastic search', async () => {
      // Given
      const asset = await assetRepo.create({ patch: fakeAssetPatch(), user: fakeUser() });
      await service.register(asset);

      // When
      await service.deleteFromIndex(asset.assetId);

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
    const assertSingleResult = (result: AssetSearchResult, asset: AssetEditDetail): void => {
      expect(result.page).toEqual({ total: 1, size: 1, offset: 0 } as PageStats);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(asset);
    };

    const testSearchInProperty =
      <T extends string | number>(text: T, setup: (asset: PatchAsset, text: T) => PatchAsset | Promise<PatchAsset>) =>
      async () => {
        // Given
        const user = fakeUser();
        const patch = await setup(fakeAssetPatch(), text);
        const asset = await create({ patch, user });
        await create({ patch: fakeAssetPatch(), user });

        // When
        const result = await service.search({ text: `${text}` }, user);

        // Then
        assertSingleResult(result, asset);
      };

    const millisPerDay = 1000 * 60 * 60 * 24;

    it(
      'finds text in titlePublic',
      testSearchInProperty(faker.string.uuid(), (asset, text) => ({
        ...asset,
        titlePublic: text,
      }))
    );

    it(
      'finds text in titleOriginal',
      testSearchInProperty(faker.string.uuid(), (asset, text) => ({
        ...asset,
        titleOriginal: text,
      }))
    );

    const contactData = fakeContact();
    it(
      'finds text in contactNames',
      testSearchInProperty(contactData.name, async (asset) => {
        const contact = await prisma.contact.create({ data: contactData });
        return {
          ...asset,
          assetContacts: [{ contactId: contact.contactId, role: 'author' }],
        };
      })
    );

    it('finds assets by minimum createDate', async () => {
      // Given
      const user = fakeUser();
      const asset = await create({ patch: fakeAssetPatch(), user });
      await create({
        patch: {
          ...fakeAssetPatch(),
          createDate: dateIdFromDate(new Date(dateFromDateId(asset.createDate).getTime() - millisPerDay * 2)),
        },
        user,
      });

      // When
      const result = await service.search(
        {
          createDate: {
            min: new Date(dateFromDateId(asset.createDate).getTime() - millisPerDay),
          },
        },
        user
      );

      // Then
      assertSingleResult(result, asset);
    });

    it('finds assets by maximum createDate', async () => {
      // Given
      const user = fakeUser();
      const asset = await create({ patch: fakeAssetPatch(), user });
      await create({
        patch: {
          ...fakeAssetPatch(),
          createDate: dateIdFromDate(new Date(dateFromDateId(asset.createDate).getTime() + millisPerDay * 2)),
        },
        user,
      });

      // When
      const result = await service.search(
        {
          createDate: {
            max: new Date(dateFromDateId(asset.createDate).getTime() + millisPerDay),
          },
        },
        user
      );

      // Then
      assertSingleResult(result, asset);
    });

    it('finds assets by createDate range', async () => {
      // Given
      const asset = await create({ patch: fakeAssetPatch(), user: fakeUser() });
      await create({
        patch: {
          ...fakeAssetPatch(),
          createDate: dateIdFromDate(new Date(dateFromDateId(asset.createDate).getTime() + millisPerDay * 2)),
        },
        user: fakeUser(),
      });
      await create({
        patch: {
          ...fakeAssetPatch(),
          createDate: dateIdFromDate(new Date(dateFromDateId(asset.createDate).getTime() - millisPerDay * 2)),
        },
        user: fakeUser(),
      });
      const user = fakeUser();

      // When
      const result = await service.search(
        {
          createDate: {
            min: new Date(dateFromDateId(asset.createDate).getTime() - millisPerDay),
            max: new Date(dateFromDateId(asset.createDate).getTime() + millisPerDay),
          },
        },
        user
      );

      // Then
      assertSingleResult(result, asset);
    });

    it('finds assets by languageItemCodes', async () => {
      // Given
      const code1 = languageItems[0].languageItemCode;
      const code2 = languageItems[1].languageItemCode;
      const code3 = languageItems[2].languageItemCode;
      const asset = await create({
        patch: { ...fakeAssetPatch(), assetLanguages: [{ languageItemCode: code1 }] },
        user: fakeUser(),
      });
      await create({
        patch: { ...fakeAssetPatch(), assetLanguages: [{ languageItemCode: code2 }] },
        user: fakeUser(),
      });
      await create({
        patch: { ...fakeAssetPatch(), assetLanguages: [{ languageItemCode: code3 }] },
        user: fakeUser(),
      });
      const user = fakeUser();

      // When
      const result = await service.search({ languageItemCodes: [code1] }, user);

      // Then
      assertSingleResult(result, asset);
    });

    it('finds assets by assetKindItemCode', async () => {
      // Given
      const code1 = assetKindItems[0].assetKindItemCode;
      const code2 = assetKindItems[1].assetKindItemCode;
      const code3 = assetKindItems[2].assetKindItemCode;
      const user = fakeUser();
      const asset = await create({ patch: { ...fakeAssetPatch(), assetKindItemCode: code1 }, user });
      await create({ patch: { ...fakeAssetPatch(), assetKindItemCode: code2 }, user });
      await create({ patch: { ...fakeAssetPatch(), assetKindItemCode: code3 }, user });

      // When
      const result = await service.search({ assetKindItemCodes: [code1] }, user);

      // Then
      assertSingleResult(result, asset);
    });

    it('finds assets by manCatLabelItemCodes', async () => {
      // Given
      const code1 = manCatLabelItems[0].manCatLabelItemCode;
      const code2 = manCatLabelItems[1].manCatLabelItemCode;
      const code3 = manCatLabelItems[2].manCatLabelItemCode;
      const user = fakeUser();
      const asset = await create({ patch: { ...fakeAssetPatch(), manCatLabelRefs: [code1] }, user });
      await create({ patch: { ...fakeAssetPatch(), manCatLabelRefs: [code2] }, user });
      await create({ patch: { ...fakeAssetPatch(), manCatLabelRefs: [code3] }, user });

      // When
      const result = await service.search({ manCatLabelItemCodes: [code1] }, user);

      // Then
      assertSingleResult(result, asset);
    });

    it('finds assets by usageCode', async () => {
      // Given
      const usageCode: UsageCode = 'public';
      const user = fakeUser();
      const asset = await create({
        patch: {
          ...fakeAssetPatch(),
          publicUse: { ...fakeAssetUsage(), isAvailable: true },
          internalUse: { ...fakeAssetUsage(), isAvailable: true },
        },
        user,
      });
      await create({
        patch: {
          ...fakeAssetPatch(),
          publicUse: { ...fakeAssetUsage(), isAvailable: false },
          internalUse: { ...fakeAssetUsage(), isAvailable: true },
        },
        user,
      });
      await create({
        patch: {
          ...fakeAssetPatch(),
          publicUse: { ...fakeAssetUsage(), isAvailable: false },
          internalUse: { ...fakeAssetUsage(), isAvailable: false },
        },
        user,
      });

      // When
      const result = await service.search({ usageCodes: [usageCode] }, user);

      // Then
      assertSingleResult(result, asset);
    });

    it('finds assets by authorId', async () => {
      // Given
      const contact1 = await prisma.contact.create({ data: fakeContact() });
      const contact2 = await prisma.contact.create({ data: fakeContact() });
      const user = fakeUser();
      const asset = await create({
        patch: { ...fakeAssetPatch(), assetContacts: [{ contactId: contact1.contactId, role: 'author' }] },
        user,
      });
      await create({
        patch: { ...fakeAssetPatch(), assetContacts: [{ contactId: contact1.contactId, role: 'supplier' }] },
        user,
      });
      await create({
        patch: { ...fakeAssetPatch(), assetContacts: [{ contactId: contact2.contactId, role: 'author' }] },
        user,
      });

      // When
      const result = await service.search({ authorId: contact1.contactId }, user);

      // Then
      assertSingleResult(result, asset);
    });
  });

  describe('aggregate', () => {
    const assertSingleStats = (stats: AssetSearchStats, asset: AssetEditDetail): void => {
      expect(stats).not.toBeNull();
      expect(stats.assetKindItemCodes).toEqual([
        {
          value: asset.assetKindItemCode,
          count: 1,
        },
      ]);
      expect(stats.languageItemCodes).toEqual(
        asset.assetLanguages.length === 0
          ? [
              {
                count: 1,
                value: 'None',
              },
            ]
          : asset.assetLanguages.map((it) => ({
              value: it.languageItemCode,
              count: 1,
            }))
      );
      expect(stats.usageCodes).toEqual([
        {
          value: makeUsageCode(asset.publicUse.isAvailable, asset.internalUse.isAvailable),
          count: 1,
        },
      ]);
      expect(stats.createDate).toEqual({
        min: dateFromDateId(asset.createDate),
        max: dateFromDateId(asset.createDate),
      });
      expect(stats.authorIds).toEqual(
        asset.assetContacts.filter((it) => it.role === 'author').map((it) => ({ value: it.contactId, count: 1 }))
      );
      expect(stats.manCatLabelItemCodes).toEqual(asset.manCatLabelRefs.map((it) => ({ value: it, count: 1 })));
    };

    it('returns empty stats when no assets are present', async () => {
      // Given
      const user = fakeUser();

      // When
      const result = await service.aggregate({}, user);

      // Then
      expect(result.total).toEqual(0);
      expect(result.authorIds).toHaveLength(0);
      expect(result.assetKindItemCodes).toHaveLength(0);
      expect(result.languageItemCodes).toHaveLength(0);
      expect(result.usageCodes).toHaveLength(0);
      expect(result.manCatLabelItemCodes).toHaveLength(0);
      expect(result.createDate).toBeNull();
    });

    it('aggregates stats for a single asset', async () => {
      // Given
      const user = fakeUser();
      const asset = await create({ patch: fakeAssetPatch(), user });

      // When
      const result = await service.aggregate({}, user);

      // Then
      assertSingleStats(result, asset);
    });
  });

  describe('searchOld', () => {
    interface Bucket {
      key: string | number;
      count: number;
    }

    const makeBucket = (
      expectedAssets: AssetEditDetail[],
      extract: (asset: AssetEditDetail) => string | number | string[] | number[]
    ): Bucket[] => {
      return expectedAssets.reduce((buckets, asset) => {
        const keyOrKeys = extract(asset);
        const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
        for (const key of keys) {
          const bucket = buckets.find((it) => it.key === key);
          if (bucket == null) {
            buckets.push({ key, count: 1 });
          } else {
            bucket.count += 1;
          }
        }
        return buckets;
      }, [] as Bucket[]);
    };

    const compareBuckets = (a: Bucket, b: Bucket): number => a.key.toString().localeCompare(b.key.toString());

    const testSearchOnProperty = (property: keyof PatchAsset & keyof ElasticSearchAsset) => async () => {
      // Given
      const uniqueString = faker.string.uuid();
      const asset1 = await assetRepo.create({
        user: fakeUser(),
        patch: { ...fakeAssetPatch(), [property]: `My unique title: ${uniqueString}` },
      });
      const asset2 = await assetRepo.create({
        user: fakeUser(),
        patch: { ...fakeAssetPatch(), [property]: `${uniqueString} is also here` },
      });
      const asset3 = await assetRepo.create({
        user: fakeUser(),
        patch: { ...fakeAssetPatch(), [property]: `${uniqueString}` },
      });
      const asset4 = await assetRepo.create({
        user: fakeUser(),
        patch: { ...fakeAssetPatch(), [property]: `some${uniqueString}things` },
      });
      await service.register(asset1);
      await service.register(asset2);
      await service.register(asset3);
      await service.register(asset4);
      const expectedAssets = [asset1, asset2, asset3, asset4];

      await service.register(
        await assetRepo.create({
          user: fakeUser(),
          patch: { ...fakeAssetPatch(), [property]: 'unrelated' },
        })
      );
      await service.register(
        await assetRepo.create({
          user: fakeUser(),
          patch: { ...fakeAssetPatch(), [property]: '' },
        })
      );
      await service.register(
        await assetRepo.create({
          user: fakeUser(),
          patch: { ...fakeAssetPatch(), [property]: uniqueString.slice(0, 6).replace(/\d/, '_') },
        })
      );

      // When
      const result = await service.searchOld(uniqueString, {
        scope: [property],
      });

      // Then
      expect(result).toMatchObject({ _tag: 'SearchAssetResultNonEmpty' });
      const { aggregations: aggs, assets } = result as SearchAssetResultNonEmpty;
      assertAssets(expectedAssets, assets);
      assertAggregations(expectedAssets, aggs);
    };

    it('should return an empty result when no assets exist', async () => {
      // When
      const result = await service.searchOld('', {
        scope: ['titlePublic', 'titleOriginal', 'contactNames'],
      });

      // Then
      expect(result).toEqual({ _tag: 'SearchAssetResultEmpty' });
    });

    it(
      'should match all assets which contain the query in their `titleOriginal`',
      testSearchOnProperty('titleOriginal')
    );
    it('should match all assets which contain the query in their `titlePublic`', testSearchOnProperty('titlePublic'));

    const assertAssets = (expectedAssets: AssetEditDetail[], actualAssets: SearchAsset[]): void => {
      expect(actualAssets.length).toEqual(expectedAssets.length);
      for (let i = 0; i < actualAssets.length; i++) {
        const actualAsset = actualAssets[i];
        const expectedAsset = expectedAssets[i];

        expect(actualAsset.assetId).toEqual(expectedAsset.assetId);
        expect(actualAsset.titlePublic).toEqual(expectedAsset.titlePublic);
        expect(actualAsset.createDate).toEqual(expectedAsset.createDate);
        expect(actualAsset.assetFormatItemCode).toEqual(expectedAsset.assetFormatItemCode);
        expect(actualAsset.assetKindItemCode).toEqual(expectedAsset.assetKindItemCode);
        expect(actualAsset.languages).toEqual(
          expectedAsset.assetLanguages.map((it) => ({ code: it.languageItemCode }))
        );
        expect(actualAsset.contacts).toEqual([]);
        expect(actualAsset.studies).toEqual([]);
        expect(actualAsset.manCatLabelItemCodes).toEqual([]);
        expect(actualAsset.usageCode).toEqual(
          makeUsageCode(expectedAsset.publicUse.isAvailable, expectedAsset.internalUse.isAvailable)
        );
      }
    };

    const assertAggregations = (expectedAssets: AssetEditDetail[], aggs: SearchAssetAggregations): void => {
      const expectedMinCreateDate = Math.min(...expectedAssets.map((it) => it.createDate));
      expect(aggs.ranges.createDate.min).toEqual(expectedMinCreateDate);

      const expectedMaxCreateDate = Math.max(...expectedAssets.map((it) => it.createDate));
      expect(aggs.ranges.createDate.max).toEqual(expectedMaxCreateDate);

      const expectedAssetKindItemCodes = makeBucket(expectedAssets, (asset) => asset.assetKindItemCode);
      expect(aggs.buckets.assetKindItemCodes.sort(compareBuckets)).toEqual(
        expectedAssetKindItemCodes.sort(compareBuckets)
      );

      const expectedLanguageItemCodes = makeBucket(expectedAssets, (asset) =>
        asset.assetLanguages.map((it) => it.languageItemCode)
      );
      const assetsWithoutLanguage = expectedAssets.filter((it) => it.assetLanguages.length === 0);
      if (assetsWithoutLanguage.length !== 0) {
        expectedLanguageItemCodes.push({
          key: 'None',
          count: assetsWithoutLanguage.length,
        });
      }
      expect(aggs.buckets.languageItemCodes.sort(compareBuckets)).toEqual(
        expectedLanguageItemCodes.sort(compareBuckets)
      );

      const expectedUsageCodes = makeBucket(expectedAssets, (asset) =>
        makeUsageCode(asset.publicUse.isAvailable, asset.internalUse.isAvailable)
      );
      expect(aggs.buckets.usageCodes.sort(compareBuckets)).toEqual(expectedUsageCodes.sort(compareBuckets));

      expect(aggs.buckets.manCatLabelItemCodes).toEqual([]);
      expect(aggs.buckets.authorIds).toEqual([]);
    };
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
      const asset1 = await assetRepo.create({ patch: fakeAssetPatch(), user: fakeUser() });
      const asset2 = await assetRepo.create({ patch: fakeAssetPatch(), user: fakeUser() });
      const asset3 = await assetRepo.create({ patch: fakeAssetPatch(), user: fakeUser() });

      // When
      await service.syncWithDatabase();

      // Then
      const response = await elastic.search({
        index: ASSET_ELASTIC_INDEX,
        size: 10_000,
        sort: {
          assetId: 'asc',
        },
        _source: true,
      });
      expect(response.hits.hits.length).toEqual(3);

      const hit1 = response.hits.hits[0]._source as ElasticSearchAsset;
      assertHit(hit1, asset1);

      const hit2 = response.hits.hits[1]._source as ElasticSearchAsset;
      assertHit(hit2, asset2);

      const hit3 = response.hits.hits[2]._source as ElasticSearchAsset;
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

    it('reports progress', async () => {
      // Given
      // Create 5000 assets so the sync has to be done in batches.
      for (let i = 0; i < 500; i++) {
        await Promise.all(
          Array.from({ length: 10 }, () =>
            assetRepo.create({
              patch: fakeAssetPatch(),
              user: fakeUser(),
            })
          )
        );
      }

      // When
      const progress: number[] = [];
      await service.syncWithDatabase((percentage) => {
        progress.push(percentage);
      });

      // Then
      expect(progress).toEqual([0.2, 0.4, 0.6, 0.8, 1]);
    }, 60_000);
  });
});
