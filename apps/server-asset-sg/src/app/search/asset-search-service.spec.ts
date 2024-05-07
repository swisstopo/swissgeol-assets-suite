import { faker } from '@faker-js/faker';

import {
    ElasticSearchAsset,
    PatchAsset, SearchAsset,
    SearchAssetAggregations,
    SearchAssetResultNonEmpty,
    makeUsageCode,
} from '@asset-sg/shared';

import indexMapping from '../../../../../development/init/elasticsearch/mappings/swissgeol_asset_asset.json';
import { clearPrismaAssets, setupDB } from '../../../../../test/setup-db';
import { fakeAssetPatch, fakeUser } from '../asset-edit/asset-edit.fake';
import { AssetEditDetail } from '../asset-edit/asset-edit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AssetRepo } from '../repos/asset.repo';

import { ASSET_ELASTIC_INDEX, AssetSearchService } from './asset-search-service';
import { openElasticsearchClient } from './elasticsearch';

describe(AssetSearchService, () => {
    const elastic = openElasticsearchClient()
    const prisma = new PrismaService()
    const assetRepo = new AssetRepo(prisma);
    const service = new AssetSearchService(elastic, prisma, assetRepo);

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
    })

    beforeEach(async () => {
        await clearPrismaAssets(prisma);
        await elastic.deleteByQuery({
            index: ASSET_ELASTIC_INDEX,
            query: { match_all: {} },
            refresh: true,
        })
    })

    describe('register', () => {
        it('adds an asset to elasticsearch', async () => {
            // Given
            const asset = await assetRepo.create({ patch: fakeAssetPatch(), user: fakeUser() });

            // When
            await service.register(asset)

            // Then
            const response = await elastic.search({
                index: ASSET_ELASTIC_INDEX,
                size: 10_000,
                _source: true,
            });
            expect(response.hits.hits.length).toEqual(1);

            const hit = response.hits.hits[0]._source as ElasticSearchAsset;
            expect(hit.assetId).toEqual(asset.assetId);
            expect(hit.titlePublic).toEqual(asset.titlePublic);
            expect(hit.titleOriginal).toEqual(asset.titleOriginal);
            expect(hit.sgsId).toEqual(asset.sgsId);
            expect(hit.createDate).toEqual(asset.createDate);
            expect(hit.assetKindItemCode).toEqual(asset.assetKindItemCode);
            expect(hit.languageItemCode).toEqual(asset.languageItemCode);
            expect(hit.usageCode).toEqual(makeUsageCode(asset.publicUse.isAvailable, asset.internalUse.isAvailable));
            expect(hit.authorIds).toEqual([]);
            expect(hit.contactNames).toEqual([]);
            expect(hit.manCatLabelItemCodes).toEqual([]);
        })
    })

    describe('search', () => {
        interface Bucket {
            key: string | number
            count: number
        }

        const makeBucket = (
            expectedAssets: AssetEditDetail[],
            extract: (asset: AssetEditDetail) => string | number,
        ): Bucket[] => {
            return expectedAssets.reduce((buckets, asset) => {
                const key = extract(asset);
                const bucket = buckets.find((it) => it.key === key);
                if (bucket == null) {
                    buckets.push({ key, count: 1 });
                } else {
                    bucket.count += 1;
                }
                return buckets;
            }, [] as Bucket[]);
        }

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

            await service.register(await assetRepo.create({
                user: fakeUser(),
                patch: { ...fakeAssetPatch(), [property]: 'unrelated' },
            }));
            await service.register(await assetRepo.create({
                user: fakeUser(),
                patch: { ...fakeAssetPatch(), [property]: '' },
            }));
            await service.register(await assetRepo.create({
                user: fakeUser(),
                patch: { ...fakeAssetPatch(), [property]: uniqueString.slice(0, 6).replace(/\d/, '_') },
            }));

            // When
            const result = await service.searchOld(uniqueString, {
                scope: [property],
            });

            // Then
            expect(result).toMatchObject({ _tag: 'SearchAssetResultNonEmpty' });
            const { aggregations: aggs, assets } = result as SearchAssetResultNonEmpty;
            assertAssets(expectedAssets, assets);
            assertAggregations(expectedAssets, aggs);
        }

        it('should return an empty result when no assets exist', async () => {
            // When
            const result = await service.searchOld('', {
                scope: ['titlePublic', 'titleOriginal', 'contactNames'],
            });

            // Then
            expect(result).toEqual({ _tag: 'SearchAssetResultEmpty' });
        })

        it(
            'should match all assets which contain the query in their `titleOriginal`',
            testSearchOnProperty('titleOriginal'),
        )
        it(
            'should match all assets which contain the query in their `titlePublic`',
            testSearchOnProperty('titlePublic'),
        )

        const assertAssets = (
            expectedAssets: AssetEditDetail[],
            actualAssets: SearchAsset[],
        ): void => {
            expect(actualAssets.length).toEqual(expectedAssets.length);
            for (let i = 0; i < actualAssets.length; i++) {
                const actualAsset = actualAssets[i];
                const expectedAsset = expectedAssets[i];

                expect(actualAsset.assetId).toEqual(expectedAsset.assetId);
                expect(actualAsset.titlePublic).toEqual(expectedAsset.titlePublic);
                expect(actualAsset.createDate).toEqual(expectedAsset.createDate);
                expect(actualAsset.assetFormatItemCode).toEqual(expectedAsset.assetFormatItemCode);
                expect(actualAsset.assetKindItemCode).toEqual(expectedAsset.assetKindItemCode);
                expect(actualAsset.languageItemCode).toEqual(expectedAsset.languageItemCode);
                expect(actualAsset.contacts).toEqual([]);
                expect(actualAsset.studies).toEqual([]);
                expect(actualAsset.manCatLabelItemCodes).toEqual([]);
                expect(actualAsset.usageCode).toEqual(
                    makeUsageCode(expectedAsset.publicUse.isAvailable, expectedAsset.internalUse.isAvailable),
                );
            }
        }

        const assertAggregations = (
            expectedAssets: AssetEditDetail[],
            aggs: SearchAssetAggregations,
        ): void => {
            const expectedMinCreateDate = Math.min(...expectedAssets.map((it) => it.createDate));
            expect(aggs.ranges.createDate.min).toEqual(expectedMinCreateDate);

            const expectedMaxCreateDate = Math.max(...expectedAssets.map((it) => it.createDate));
            expect(aggs.ranges.createDate.max).toEqual(expectedMaxCreateDate);

            const expectedAssetKindItemCodes = makeBucket(expectedAssets, (asset) => asset.assetKindItemCode);
            expect(aggs.buckets.assetKindItemCodes.sort(compareBuckets))
                .toEqual(expectedAssetKindItemCodes.sort(compareBuckets));

            const expectedLanguageItemCodes = makeBucket(expectedAssets, (asset) => asset.languageItemCode);
            expect(aggs.buckets.languageItemCodes.sort(compareBuckets))
                .toEqual(expectedLanguageItemCodes.sort(compareBuckets));

            const expectedUsageCodes = makeBucket(expectedAssets, (asset) => (
                makeUsageCode(asset.publicUse.isAvailable, asset.internalUse.isAvailable)
            ));
            expect(aggs.buckets.usageCodes.sort(compareBuckets))
                .toEqual(expectedUsageCodes.sort(compareBuckets));

            expect(aggs.buckets.manCatLabelItemCodes).toEqual([]);
            expect(aggs.buckets.authorIds).toEqual([]);
        }
    })
})
