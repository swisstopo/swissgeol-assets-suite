/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Asset, FileProcessingState, LegalDocCode, UpdateAssetData } from '@asset-sg/shared/v2';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { setupContractLegalDocItem } from '../../../../../test/file-fixtures';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { clearPrismaAssets, setupDB } from '../../../../../test/setup-db';

import { fakeCreateAssetData, fakeUpdateAssetData, fakeUserData } from './asset.fake';

import { PrismaService } from '@/core/prisma.service';
import { AssetRepo } from '@/features/assets/asset.repo';
import { FileRepo } from '@/features/assets/files/file.repo';
import { UserRepo } from '@/features/users/user.repo';

describe(AssetRepo, () => {
  const prisma = new PrismaService();
  const fileRepo = new FileRepo(prisma);
  const userRepo = new UserRepo(prisma);
  const repo = new AssetRepo(prisma, fileRepo);

  beforeAll(async () => {
    await setupDB(prisma);
  });

  beforeEach(async () => {
    await clearPrismaAssets(prisma);
  });

  const createWithKinds = async (kindCodes: string[]): Promise<Asset> => {
    const user = await userRepo.create(fakeUserData());
    return repo.create({ ...fakeCreateAssetData(), kindCodes, creatorId: user.id });
  };

  const findKindCodes = async (id: number): Promise<string[] | undefined> => (await repo.find(id))?.kindCodes;

  describe('find', () => {
    it('returns `null` when searching for a non-existent record', async () => {
      // When
      const asset = await repo.find(1);

      // Then
      expect(asset).toBeNull();
    });

    it('returns the record associated with a specific id', async () => {
      // Given
      const user = await userRepo.create(fakeUserData());
      const data = fakeCreateAssetData();
      const expected = await repo.create({ ...data, creatorId: user.id });

      // When
      const actual = await repo.find(expected.id);

      // Then
      expect(actual).not.toBeNull();
      expect(actual).toEqual(expected);
    });
  });

  describe('list', () => {
    it('returns an empty list when no records exist', async () => {
      // When
      const assets = await repo.list({ limit: 100 });

      // Then
      expect(assets).toEqual([]);
    });

    it('returns the specified amount of records', async () => {
      // Given
      const user = await userRepo.create(fakeUserData());
      const record1 = await repo.create({ ...fakeCreateAssetData(), creatorId: user.id });
      const record2 = await repo.create({ ...fakeCreateAssetData(), creatorId: user.id });
      const record3 = await repo.create({ ...fakeCreateAssetData(), creatorId: user.id });
      await repo.create({ ...fakeCreateAssetData(), creatorId: user.id });
      await repo.create({ ...fakeCreateAssetData(), creatorId: user.id });

      // When
      const assets = await repo.list({ limit: 3 });

      // Then
      expect(assets.length).toEqual(3);
      expect(assets).toEqual([record1, record2, record3]);
    });

    it('returns the records appearing after the specified offset', async () => {
      // Given
      const user = await userRepo.create(fakeUserData());
      await repo.create({ ...fakeCreateAssetData(), creatorId: user.id });
      await repo.create({ ...fakeCreateAssetData(), creatorId: user.id });
      const record1 = await repo.create({ ...fakeCreateAssetData(), creatorId: user.id });
      const record2 = await repo.create({ ...fakeCreateAssetData(), creatorId: user.id });
      const record3 = await repo.create({ ...fakeCreateAssetData(), creatorId: user.id });

      // When
      const assets = await repo.list({ offset: 2, limit: 100 });

      // Then
      expect(assets.length).toEqual(3);
      expect(assets).toEqual([record1, record2, record3]);
    });

    it('returns an empty list when offset is larger than the total amount of records', async () => {
      // Given
      const user = await userRepo.create(fakeUserData());
      await repo.create({ ...fakeCreateAssetData(), creatorId: user.id });
      await repo.create({ ...fakeCreateAssetData(), creatorId: user.id });
      await repo.create({ ...fakeCreateAssetData(), creatorId: user.id });
      await repo.create({ ...fakeCreateAssetData(), creatorId: user.id });

      // When
      const assets = await repo.list({ offset: 5, limit: 10 });

      // Then
      expect(assets).toEqual([]);
    });
  });

  describe('create', () => {
    it('inserts a new record', async () => {
      // Given
      const user = await userRepo.create(fakeUserData());
      const data = fakeCreateAssetData();

      // When
      const record = await repo.create({ ...data, creatorId: user.id });

      // Then
      expect(record.title).toEqual(data.title);
      expect(record.originalTitle).toEqual(data.originalTitle);
      expect(record.createdAt).toEqual(data.createdAt);
      expect(record.receivedAt).toEqual(data.receivedAt);
      expect(record.isPublic).toEqual(data.isPublic);
      expect(record.kindCodes).toEqual(data.kindCodes);
      expect(record.formatCodes).toEqual([]);
      expect(record.isOfNationalInterest).toEqual(data.isOfNationalInterest);
      expect(record.legacyData).toBeNull();
      expect(record.identifiers).toEqual(data.identifiers);
      expect(record.contacts).toEqual(data.contacts);
      expect(record.languageCodes).toEqual(data.languageCodes);
      expect(record.topicCodes).toEqual(data.topicCodes);
      expect(record.nationalInterestTypeCodes).toEqual(data.nationalInterestTypeCodes);
      expect(record.parent).toBeNull();
      expect(record.children).toEqual([]);
      expect(record.siblings).toEqual([]);
      expect(record.files).toEqual([]);
      expect(record.workgroupId).toEqual(data.workgroupId);
    });

    it('stores several types and returns them in a stable order', async () => {
      // Given
      // When
      const record = await createWithKinds(['report', 'map', '2Dseismic']);

      // Then
      expect(record.kindCodes).toEqual(['2Dseismic', 'map', 'report']);
      expect(await findKindCodes(record.id)).toEqual(['2Dseismic', 'map', 'report']);
    });

    it('stores duplicate types only once', async () => {
      // Given
      // When
      const record = await createWithKinds(['report', 'report', 'map']);

      // Then
      expect(record.kindCodes).toEqual(['map', 'report']);
      expect(await prisma.assetKind.count({ where: { assetId: record.id } })).toEqual(2);
    });

    it('rejects a type that is not part of the vocabulary', async () => {
      // Given
      const user = await userRepo.create(fakeUserData());

      // When
      const create = repo.create({ ...fakeCreateAssetData(), kindCodes: ['report', 'noSuchType'], creatorId: user.id });

      // Then
      await expect(create).rejects.toThrow();
      expect(await prisma.asset.count()).toEqual(0);
    });

    it('inserts a new record without a receipt date', async () => {
      // Given
      const user = await userRepo.create(fakeUserData());
      const data = { ...fakeCreateAssetData(), receivedAt: null };

      // When
      const record = await repo.create({ ...data, creatorId: user.id });

      // Then
      expect(record.receivedAt).toBeNull();
      expect((await repo.find(record.id))!.receivedAt).toBeNull();
      const row = await prisma.asset.findUniqueOrThrow({ where: { assetId: record.id } });
      expect(row.receiptDate).toBeNull();
    });
  });

  describe('update', () => {
    it('returns `null` when updating a non-existent record', async () => {
      // Given
      const data = fakeUpdateAssetData();

      // When
      const asset = await repo.update(1, data);

      // Then
      expect(asset).toBeNull();
    });

    it('should update the fields of an existing record', async () => {
      // Given
      const creator = await userRepo.create(fakeUserData());
      const record = await repo.create({ ...fakeCreateAssetData(), creatorId: creator.id });
      const data = fakeUpdateAssetData();

      // When
      const updated = await repo.update(record.id, data);

      // Then
      expect(updated).not.toBeNull();
      expect(updated!.id).toEqual(record.id);
      expect(updated!.title).toEqual(data.title);
      expect(updated!.originalTitle).toEqual(data.originalTitle);
      expect(updated!.createdAt).toEqual(data.createdAt);
      expect(updated!.receivedAt).toEqual(data.receivedAt);
      expect(updated!.isPublic).toEqual(data.isPublic);
      expect(updated!.kindCodes).toEqual(data.kindCodes);
      expect(updated!.formatCodes).toEqual([]);
      expect(updated!.isOfNationalInterest).toEqual(data.isOfNationalInterest);
      expect(updated!.legacyData).toBeNull();
      expect(updated!.identifiers).toEqual(data.identifiers);
      expect(updated!.contacts).toEqual(data.contacts);
      expect(updated!.languageCodes).toEqual(data.languageCodes);
      expect(updated!.topicCodes).toEqual(data.topicCodes);
      expect(updated!.nationalInterestTypeCodes).toEqual(data.nationalInterestTypeCodes);
      expect(updated!.parent).toBeNull();
      expect(updated!.children).toEqual([]);
      expect(updated!.siblings).toEqual([]);
      expect(updated!.files).toEqual([]);
      expect(updated!.workgroupId).toEqual(data.workgroupId);
    });

    it('replaces the set of types', async () => {
      // Given
      const record = await createWithKinds(['report', 'map']);

      // When
      const updated = await repo.update(record.id, {
        ...fakeUpdateAssetData(),
        kindCodes: ['map', 'log', '3Dseismic'],
      });

      // Then
      expect(updated!.kindCodes).toEqual(['3Dseismic', 'log', 'map']);
      expect(await findKindCodes(record.id)).toEqual(['3Dseismic', 'log', 'map']);
    });

    it('keeps the stored types when the selection is reordered or contains duplicates', async () => {
      // Given
      const record = await createWithKinds(['report', 'map']);

      // When
      const updated = await repo.update(record.id, {
        ...fakeUpdateAssetData(),
        kindCodes: ['report', 'map', 'map'],
      });

      // Then
      expect(updated!.kindCodes).toEqual(['map', 'report']);
      expect(await prisma.assetKind.count({ where: { assetId: record.id } })).toEqual(2);
    });

    it('keeps the stored types when an update contains an unknown type', async () => {
      // Given
      const record = await createWithKinds(['report']);

      // When
      const updated = await repo.update(record.id, { ...fakeUpdateAssetData(), kindCodes: ['noSuchType'] });

      // Then
      expect(updated).toBeNull();
      expect(await findKindCodes(record.id)).toEqual(['report']);
    });

    it('clears the receipt date when updating it to `null`', async () => {
      // Given
      const creator = await userRepo.create(fakeUserData());
      const record = await repo.create({ ...fakeCreateAssetData(), creatorId: creator.id });
      expect(record.receivedAt).not.toBeNull();

      // When
      const updated = await repo.update(record.id, { ...fakeUpdateAssetData(), receivedAt: null });

      // Then
      expect(updated!.receivedAt).toBeNull();
      const row = await prisma.asset.findUniqueOrThrow({ where: { assetId: record.id } });
      expect(row.receiptDate).toBeNull();
    });

    it('sets a receipt date on a record that has none', async () => {
      // Given
      const creator = await userRepo.create(fakeUserData());
      const record = await repo.create({ ...fakeCreateAssetData(), receivedAt: null, creatorId: creator.id });
      const data = fakeUpdateAssetData();

      // When
      const updated = await repo.update(record.id, data);

      // Then
      expect(updated!.receivedAt).toEqual(data.receivedAt);
    });
  });

  describe('file formats', () => {
    beforeAll(async () => {
      await setupContractLegalDocItem(prisma);
    });

    const sortedFiles = (asset: Asset): Asset['files'] => [...asset.files].sort((a, b) => a.id - b.id);

    const fileFormats = (asset: Asset | null): string[] => sortedFiles(asset!).map((it) => it.formatCode);

    const createAssetWithFiles = async (
      files: Array<{ name: string; formatCode?: string; legalDocCode?: LegalDocCode }>,
    ): Promise<Asset> => {
      const user = await userRepo.create(fakeUserData());
      const asset = await repo.create({ ...fakeCreateAssetData(), creatorId: user.id });
      for (const file of files) {
        await fileRepo.create({
          name: file.name,
          size: 1,
          legalDocCode: file.legalDocCode ?? null,
          formatCode: file.formatCode,
          fileProcessingState: FileProcessingState.WillNotBeProcessed,
          fileProcessingStage: null,
          assetId: asset.id,
          user,
        });
      }
      return (await repo.find(asset.id))!;
    };

    const toUpdateData = (asset: Asset, files: Asset['files'] = asset.files): UpdateAssetData => ({
      ...fakeUpdateAssetData(),
      files: files.map((it) => ({
        id: it.id,
        legalDocCode: it.legalDocCode,
        formatCode: it.formatCode,
        pageRangeClassifications: it.pageRangeClassifications,
      })),
    });

    it('derives the distinct formats of the non-legal files', async () => {
      // When
      const asset = await createAssetWithFiles([
        { name: 'a.csv', formatCode: 'other' },
        { name: 'b.pdf' },
        { name: 'c.PDF' },
        { name: 'contract.las', legalDocCode: LegalDocCode.Contract },
      ]);

      // Then
      expect(fileFormats(asset)).toEqual(['other', 'pdf', 'pdf', 'las']);
      expect(asset.formatCodes).toEqual(['pdf', 'other']);
    });

    it('returns no formats for an asset with only legal files', async () => {
      // When
      const asset = await createAssetWithFiles([{ name: 'contract.pdf', legalDocCode: LegalDocCode.Contract }]);

      // Then
      expect(asset.files[0].formatCode).toEqual('pdf');
      expect(asset.formatCodes).toEqual([]);
    });

    it('persists a format override through update and reload', async () => {
      // Given
      const asset = await createAssetWithFiles([{ name: 'map.pdf' }, { name: 'notes.txt' }]);
      const [map, notes] = sortedFiles(asset);

      // When
      const updated = await repo.update(
        asset.id,
        toUpdateData(asset, [{ ...map, formatCode: 'graphicRaster' }, notes]),
      );

      // Then
      expect(fileFormats(updated)).toEqual(['graphicRaster', 'textDigital']);
      expect(updated!.formatCodes).toEqual(['textDigital', 'graphicRaster']);
      const reloaded = await repo.find(asset.id);
      expect(fileFormats(reloaded)).toEqual(['graphicRaster', 'textDigital']);
      expect(reloaded!.formatCodes).toEqual(['textDigital', 'graphicRaster']);
    });

    it('keeps a format override when unrelated fields are updated', async () => {
      // Given
      const asset = await createAssetWithFiles([{ name: 'map.pdf', formatCode: 'graphicRaster' }]);

      // When
      const updated = await repo.update(asset.id, { ...toUpdateData(asset), title: 'Another title' });

      // Then
      expect(updated!.title).toEqual('Another title');
      expect((await repo.find(asset.id))!.files[0].formatCode).toEqual('graphicRaster');
    });

    it('rejects an unknown file format and keeps the stored format', async () => {
      // Given
      const asset = await createAssetWithFiles([{ name: 'map.pdf' }]);

      // When
      const update = repo.update(asset.id, toUpdateData(asset, [{ ...asset.files[0], formatCode: 'noSuchFormat' }]));

      // Then
      await expect(update).rejects.toThrow();
      expect((await repo.find(asset.id))!.files[0].formatCode).toEqual('pdf');
    });
  });

  describe('delete', () => {
    it('returns `false` when deleting an non-existent record', async () => {
      // When
      const isOk = await repo.delete(1);

      // Then
      expect(isOk).toEqual(false);
    });

    it('removes a record and its relations from the database', async () => {
      // Given
      const creator = await userRepo.create(fakeUserData());
      const record = await repo.create({ ...fakeCreateAssetData(), creatorId: creator.id });

      // When
      const isOk = await repo.delete(record.id);

      // Then
      expect(isOk).toEqual(true);

      const assetCount = await prisma.asset.count({ where: { assetId: record.id } });
      expect(assetCount).toEqual(0);
      expect(await prisma.assetKind.count({ where: { assetId: record.id } })).toEqual(0);
    });
  });
});
