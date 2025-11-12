/* eslint-disable @typescript-eslint/no-non-null-assertion */
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
      expect(record.kindCode).toEqual(data.kindCode);
      expect(record.formatCode).toEqual(data.formatCode);
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
      expect(updated!.kindCode).toEqual(data.kindCode);
      expect(updated!.formatCode).toEqual(data.formatCode);
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
    });
  });
});
