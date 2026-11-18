import { ElasticsearchFilePage, AssetSearchResultItem, LegalDocCode } from '@asset-sg/shared/v2';

// eslint-disable-next-line @nx/enforce-module-boundaries
import fileIndexMapping from '../../../../../../development/init/elasticsearch/mappings/swissgeol_asset_file.json';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { createTestFile, setupContractLegalDocItem } from '../../../../../../test/file-fixtures';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { clearPrismaAssets, setupDB } from '../../../../../../test/setup-db';

import { FileSearchWriterService } from './file-search-writer.service';

import { openElasticsearchClient } from '@/core/elasticsearch';
import { PrismaService } from '@/core/prisma.service';
import { fakeCreateAssetData, fakeUserData } from '@/features/assets/asset.fake';
import { AssetRepo } from '@/features/assets/asset.repo';
import { FileRepo } from '@/features/assets/files/file.repo';
import { GeometryDetailRepo } from '@/features/geometries/geometry-detail.repo';
import { GeometryRepo } from '@/features/geometries/geometry.repo';
import { UserRepo } from '@/features/users/user.repo';

const TEST_INDEX = 'swissgeol_asset_file_kind_codes_test';

describe(FileSearchWriterService, () => {
  const elastic = openElasticsearchClient();
  const prisma = new PrismaService();
  const assetRepo = new AssetRepo(prisma, new FileRepo(prisma));
  const userRepo = new UserRepo(prisma);
  const writer = new FileSearchWriterService(
    elastic,
    prisma,
    new GeometryRepo(prisma),
    new GeometryDetailRepo(prisma),
    {
      index: TEST_INDEX,
      shouldRefresh: true,
    },
  );

  beforeAll(async () => {
    await elastic.indices.delete({ index: TEST_INDEX, ignore_unavailable: true });
    await elastic.indices.create({ index: TEST_INDEX });
    await elastic.indices.putMapping({ index: TEST_INDEX, ...fileIndexMapping });
    await setupDB(prisma);
  });

  afterAll(async () => {
    await elastic.indices.delete({ index: TEST_INDEX, ignore_unavailable: true });
  });

  beforeEach(async () => {
    await clearPrismaAssets(prisma);
    await elastic.deleteByQuery({ index: TEST_INDEX, query: { match_all: {} }, refresh: true });
  });

  it('indexes all types of an asset with each of its file pages', async () => {
    // Given
    const user = await userRepo.create(fakeUserData());
    const asset = await assetRepo.create({
      ...fakeCreateAssetData(),
      kindCodes: ['report', 'map', '2Dseismic'],
      creatorId: user.id,
    });
    const file = await createTestFile(prisma, asset.id, { content: true });

    // When
    await writer.write(file.id);

    // Then
    const response = await elastic.search<ElasticsearchFilePage>({ index: TEST_INDEX, query: { match_all: {} } });
    expect(response.hits.hits).toHaveLength(1);
    const doc = response.hits.hits[0]._source as ElasticsearchFilePage;
    expect(doc.kindCodes).toEqual(['2Dseismic', 'map', 'report']);
    expect((JSON.parse(doc.data) as AssetSearchResultItem).kindCodes).toEqual(['2Dseismic', 'map', 'report']);

    const byAnyType = await elastic.search({ index: TEST_INDEX, query: { term: { kindCodes: 'map' } } });
    expect(byAnyType.hits.hits).toHaveLength(1);
  });

  describe('file formats', () => {
    beforeAll(async () => {
      await setupContractLegalDocItem(prisma);
    });

    // An asset with a searchable PDF, a CSV without content and a legal document of a distinct format.
    const createAssetWithFiles = async () => {
      const user = await userRepo.create(fakeUserData());
      const asset = await assetRepo.create({ ...fakeCreateAssetData(), creatorId: user.id });
      const pdf = await createTestFile(prisma, asset.id, { name: 'report.pdf', content: true });
      await createTestFile(prisma, asset.id, { name: 'data.csv', formatCode: 'db' });
      await createTestFile(prisma, asset.id, {
        name: 'contract.pdf',
        formatCode: 'textAnalog',
        legalDocItemCode: LegalDocCode.Contract,
        content: true,
      });
      return { asset, pdf };
    };

    const indexedFormatCodes = async (): Promise<string[][]> => {
      const response = await elastic.search<ElasticsearchFilePage>({ index: TEST_INDEX, query: { match_all: {} } });
      return response.hits.hits.map(
        (hit) => (JSON.parse(hit._source?.data ?? '{}') as AssetSearchResultItem).formatCodes,
      );
    };

    it('writes the distinct formats of all non-legal files of the asset when writing a file', async () => {
      // Given
      const { pdf } = await createAssetWithFiles();

      // When
      await writer.write(pdf.id);

      // Then
      expect(await indexedFormatCodes()).toEqual([['pdf', 'db']]);
    });

    it("writes the asset's derived formats when writing all files of an asset", async () => {
      // Given
      const { asset } = await createAssetWithFiles();
      const reloaded = await assetRepo.find(asset.id);
      if (reloaded == null) {
        throw new Error(`asset ${asset.id} not found`);
      }

      // When
      await writer.writeAssetFiles(reloaded);

      // Then
      expect(await indexedFormatCodes()).toEqual([
        ['pdf', 'db'],
        ['pdf', 'db'],
      ]);
    });
  });
});
