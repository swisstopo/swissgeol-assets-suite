import { Asset, AssetSearchResultItem, ElasticsearchFilePage, WorkflowStatus } from '@asset-sg/shared/v2';

// eslint-disable-next-line @nx/enforce-module-boundaries
import fileIndexMapping from '../../../../../../development/init/elasticsearch/mappings/swissgeol_asset_file.json';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { clearPrismaAssets, setupDB } from '../../../../../../test/setup-db';

import { FileSearchWriterService } from './file-search-writer.service';

import { openElasticsearchClient } from '@/core/elasticsearch';
import { PrismaService } from '@/core/prisma.service';
import { fakeCreateAssetData, fakeUserData } from '@/features/assets/asset.fake';
import { AssetRepo } from '@/features/assets/asset.repo';
import { FileRepo } from '@/features/assets/files/file.repo';
import { WorkflowRepo } from '@/features/assets/workflow/workflow.repo';
import { GeometryDetailRepo } from '@/features/geometries/geometry-detail.repo';
import { GeometryRepo } from '@/features/geometries/geometry.repo';
import { UserRepo } from '@/features/users/user.repo';

const TEST_INDEX = 'swissgeol_asset_file_kind_codes_test';

describe(FileSearchWriterService, () => {
  const elastic = openElasticsearchClient();
  const prisma = new PrismaService();
  const assetRepo = new AssetRepo(prisma, new FileRepo(prisma));
  const userRepo = new UserRepo(prisma);
  const workflowRepo = new WorkflowRepo(prisma);
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
    const file = await prisma.file.create({
      data: {
        name: 'file.pdf',
        size: 1,
        lastModifiedAt: new Date(),
        assetId: asset.id,
        fulltextContent: [{ page: 1, content: 'Some text' }],
      },
    });

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

  describe('workflow fields', () => {
    const createAssetWithFile = async () => {
      const user = await userRepo.create(fakeUserData());
      const asset = await assetRepo.create({ ...fakeCreateAssetData(), creatorId: user.id });
      const file = await prisma.file.create({
        data: {
          name: 'file.pdf',
          size: 1,
          lastModifiedAt: new Date(),
          assetId: asset.id,
          fulltextContent: [{ page: 1, content: 'Some text' }],
        },
      });
      await workflowRepo.change(asset.id, {
        creatorId: user.id,
        comment: null,
        hasRequestedChanges: true,
        from: { status: WorkflowStatus.Draft, assigneeId: user.id },
        to: { status: WorkflowStatus.InReview, assigneeId: user.id },
      });
      return { asset: (await assetRepo.find(asset.id)) as Asset, file };
    };

    const readIndexedItem = async (): Promise<AssetSearchResultItem> => {
      const response = await elastic.search<ElasticsearchFilePage>({ index: TEST_INDEX, query: { match_all: {} } });
      expect(response.hits.hits).toHaveLength(1);
      return JSON.parse((response.hits.hits[0]._source as ElasticsearchFilePage).data);
    };

    it('indexes the status and the requested-changes flag when writing by file id', async () => {
      const { file } = await createAssetWithFile();

      await writer.write(file.id);

      const item = await readIndexedItem();
      expect(item.workflowStatus).toEqual(WorkflowStatus.InReview);
      expect(item.hasRequestedChanges).toEqual(true);
    });

    it('indexes the status and the requested-changes flag when writing by asset', async () => {
      const { asset } = await createAssetWithFile();

      await writer.writeAssetFiles(asset);

      const item = await readIndexedItem();
      expect(item.workflowStatus).toEqual(WorkflowStatus.InReview);
      expect(item.hasRequestedChanges).toEqual(true);
    });
  });
});
