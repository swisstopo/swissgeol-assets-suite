import { FileProcessingState } from '@asset-sg/shared/v2';
import { faker } from '@faker-js/faker';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { clearPrismaAssets, setupDB } from '../../../../../../test/setup-db';
import { PrismaService } from '@/core/prisma.service';
import { fakeCreateAssetData, fakeUserData } from '@/features/assets/asset.fake';
import { AssetRepo } from '@/features/assets/asset.repo';
import { fakeFile } from '@/features/assets/files/file.fake';
import { determineUniqueFilename, FileRepo, UniqueFileName } from '@/features/assets/files/file.repo';
import { UserRepo } from '@/features/users/user.repo';

describe(FileRepo, () => {
  const prisma = new PrismaService();
  const repo = new FileRepo(prisma);
  const userRepo = new UserRepo(prisma);
  const assetRepo = new AssetRepo(prisma, repo);

  beforeAll(async () => {
    await setupDB(prisma);
  });

  beforeEach(async () => {
    await clearPrismaAssets(prisma);
  });

  describe('determineUniqueFilename', () => {
    it("prepends the assetId to the file's name", async () => {
      // Given
      const assetId = faker.number.int({ min: 1 });
      const original = 'my_file.name.exe';

      // When
      const actual = await determineUniqueFilename(original, assetId, prisma);

      // Then
      const expected: UniqueFileName = {
        fileName: `a${assetId}_${original}`,
        nameAlias: original,
      };
      expect(actual).toEqual(expected);
    });

    it('uses the name as-is if it is already prefixed with the assetId', async () => {
      // Given
      const assetId = faker.number.int({ min: 1 });
      const original = `a${assetId}_some-Other.filename.123`;

      // When
      const actual = await determineUniqueFilename(original, assetId, prisma);

      // Then
      const expected: UniqueFileName = {
        fileName: original,
        nameAlias: original,
      };
      expect(actual).toEqual(expected);
    });

    it('makes the file name unique by appending the current date and time', async () => {
      // Given
      const fileName = 'name';
      const fileExt = 'txt';
      const fullFileName = `${fileName}.${fileExt}`;
      const assetId = faker.number.int({ min: 1 });

      // When
      await prisma.file.create({
        data: {
          name: `a${assetId}_${fullFileName}`,
          size: faker.number.int({ min: 0 }),
          lastModifiedAt: faker.date.past(),
          type: faker.helpers.arrayElement(['Normal', 'Legal']),
          fileProcessingState: FileProcessingState.WillNotBeProcessed,
        },
      });
      const actual = await determineUniqueFilename(fullFileName, assetId, prisma);

      // Then
      expect(actual.nameAlias).toEqual(fullFileName);
      expect(actual.fileName).toMatch(
        new RegExp(`^a${assetId}_${fileName}_\\d{4}\\d{2}\\d{2}\\d{2}\\d{2}\\d{2}\\.${fileExt}$`),
      );
    });
  });

  describe('list', () => {
    it('returns an empty list when no records exist', async () => {
      // When
      const files = await repo.list({ limit: 100 });

      // Then
      expect(files).toEqual([]);
    });

    it('returns the specified amount of records', async () => {
      // Given
      const user = await userRepo.create(fakeUserData());
      const asset = await assetRepo.create({ ...fakeCreateAssetData(), creatorId: user.id });

      const record1 = await repo.create({ ...fakeFile(), user, assetId: asset.id });
      const record2 = await repo.create({ ...fakeFile(), user, assetId: asset.id });
      const record3 = await repo.create({ ...fakeFile(), user, assetId: asset.id });
      await repo.create({ ...fakeFile(), user, assetId: asset.id });
      await repo.create({ ...fakeFile(), user, assetId: asset.id });

      // When
      const files = await repo.list({ limit: 3 });

      // Then
      expect(files.length).toEqual(3);
      expect(files).toEqual([record1, record2, record3]);
    });

    it('returns the records appearing after the specified offset', async () => {
      // Given
      const user = await userRepo.create(fakeUserData());
      const asset = await assetRepo.create({ ...fakeCreateAssetData(), creatorId: user.id });

      await repo.create({ ...fakeFile(), user, assetId: asset.id });
      await repo.create({ ...fakeFile(), user, assetId: asset.id });
      const record1 = await repo.create({ ...fakeFile(), user, assetId: asset.id });
      const record2 = await repo.create({ ...fakeFile(), user, assetId: asset.id });
      const record3 = await repo.create({ ...fakeFile(), user, assetId: asset.id });

      // When
      const files = await repo.list({ offset: 2, limit: 100 });

      // Then
      expect(files.length).toEqual(3);
      expect(files).toEqual([record1, record2, record3]);
    });

    it('returns an empty list when offset is larger than the total amount of records', async () => {
      // Given
      const user = await userRepo.create(fakeUserData());
      const asset = await assetRepo.create({ ...fakeCreateAssetData(), creatorId: user.id });

      await repo.create({ ...fakeFile(), user, assetId: asset.id });
      await repo.create({ ...fakeFile(), user, assetId: asset.id });
      await repo.create({ ...fakeFile(), user, assetId: asset.id });
      await repo.create({ ...fakeFile(), user, assetId: asset.id });

      // When
      const assets = await repo.list({ offset: 5, limit: 10 });

      // Then
      expect(assets).toEqual([]);
    });

    it('lists all files of a specific asset', async () => {
      // Given
      const user = await userRepo.create(fakeUserData());
      const asset = await assetRepo.create({ ...fakeCreateAssetData(), creatorId: user.id });
      const asset2 = await assetRepo.create({ ...fakeCreateAssetData(), creatorId: user.id });

      await repo.create({ ...fakeFile(), user, assetId: asset2.id });
      const record1 = await repo.create({ ...fakeFile(), user, assetId: asset.id });
      await repo.create({ ...fakeFile(), user, assetId: asset2.id });
      await repo.create({ ...fakeFile(), user, assetId: asset2.id });
      await repo.create({ ...fakeFile(), user, assetId: asset2.id });
      const record2 = await repo.create({ ...fakeFile(), user, assetId: asset.id });
      const record3 = await repo.create({ ...fakeFile(), user, assetId: asset.id });
      await repo.create({ ...fakeFile(), user, assetId: asset2.id });

      // When
      const assets = await repo.list({ assetId: asset.id, limit: 10 });

      // Then
      expect(assets).toEqual([record1, record2, record3]);
    });
  });
});
