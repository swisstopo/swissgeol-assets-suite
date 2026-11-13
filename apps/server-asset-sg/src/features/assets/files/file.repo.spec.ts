import { FileProcessingState } from '@asset-sg/shared/v2';
import { faker } from '@faker-js/faker';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { clearPrismaAssets, setupDB } from '../../../../../../test/setup-db';
import { PrismaService } from '@/core/prisma.service';
import { fakeCreateAssetData, fakeUserData } from '@/features/assets/asset.fake';
import { AssetRepo } from '@/features/assets/asset.repo';
import { fakeFile } from '@/features/assets/files/file.fake';
import { determineUniqueFilename, FileRepo, UniqueFileName } from '@/features/assets/files/file.repo';
import { mapAssetDataToPrismaCreate } from '@/features/assets/prisma-asset';
import { UserRepo } from '@/features/users/user.repo';

const MAX_SAFE_INT32 = 2_147_483_647;

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
      const assetId = faker.number.int({ min: 1, max: MAX_SAFE_INT32 });
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
      const assetId = faker.number.int({ min: 1, max: MAX_SAFE_INT32 });
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
      const assetId = faker.number.int({ min: 1, max: MAX_SAFE_INT32 });
      const user = await userRepo.create(fakeUserData());

      // When
      await prisma.file.create({
        data: {
          name: `a${assetId}_${fullFileName}`,
          size: faker.number.int({ min: 0, max: MAX_SAFE_INT32 }),
          lastModifiedAt: faker.date.past(),
          type: faker.helpers.arrayElement(['Normal', 'Legal']),
          fileProcessingState: FileProcessingState.WillNotBeProcessed,
          assetFormatItem: { connect: { assetFormatItemCode: 'textDigital' } },
          isFormatOverridden: false,
          asset: { create: { ...mapAssetDataToPrismaCreate({ ...fakeCreateAssetData(), creatorId: user.id }) } },
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

  describe('create', () => {
    const createFile = async (data: { name: string; formatCode?: string }) => {
      const user = await userRepo.create(fakeUserData());
      const asset = await assetRepo.create({ ...fakeCreateAssetData(), creatorId: user.id });
      return repo.create({
        ...data,
        size: 1,
        legalDocCode: null,
        fileProcessingState: FileProcessingState.WillNotBeProcessed,
        fileProcessingStage: null,
        assetId: asset.id,
        user,
      });
    };

    it('stores the supplied format as an override, even if it differs from the extension', async () => {
      // When
      const record = await createFile({ name: 'scan.pdf', formatCode: 'graphicRaster' });

      // Then
      expect(record.formatCode).toEqual('graphicRaster');
      const row = await prisma.file.findUniqueOrThrow({ where: { id: record.id } });
      expect(row.assetFormatItemCode).toEqual('graphicRaster');
      expect(row.isFormatOverridden).toBe(true);
    });

    it('stores a supplied format as an override, even if it equals the detected format', async () => {
      // When
      const record = await createFile({ name: 'scan.pdf', formatCode: 'pdf' });

      // Then
      const row = await prisma.file.findUniqueOrThrow({ where: { id: record.id } });
      expect(row.assetFormatItemCode).toEqual('pdf');
      expect(row.isFormatOverridden).toBe(true);
    });

    it.each([
      ['Report.PDF', 'pdf'],
      ['layer.shp', 'GISFormat'],
      ['metadata.xml', 'other'],
      ['archive.tar.gz', 'other'],
      ['README', 'other'],
    ])('derives the format of %s from its extension', async (name, expected) => {
      // When
      const record = await createFile({ name });

      // Then
      expect(record.formatCode).toEqual(expected);
      const row = await prisma.file.findUniqueOrThrow({ where: { id: record.id } });
      expect(row.assetFormatItemCode).toEqual(expected);
      expect(row.isFormatOverridden).toBe(false);
    });

    it('derives the format from the uploaded name rather than the stored name', async () => {
      // Given
      const user = await userRepo.create(fakeUserData());
      const asset = await assetRepo.create({ ...fakeCreateAssetData(), creatorId: user.id });
      const data = {
        size: 1,
        legalDocCode: null,
        fileProcessingState: FileProcessingState.WillNotBeProcessed,
        fileProcessingStage: null,
        assetId: asset.id,
        user,
      };
      await repo.create({ ...data, name: 'notes.txt' });

      // When
      const record = await repo.create({ ...data, name: 'notes.txt' });

      // Then
      expect(record.name).not.toEqual(`a${asset.id}_notes.txt`);
      expect(record.formatCode).toEqual('textDigital');
    });

    it('rejects a format that is not part of the vocabulary', async () => {
      // When
      const create = createFile({ name: 'scan.pdf', formatCode: 'noSuchFormat' });

      // Then
      await expect(create).rejects.toThrow();
      expect(await prisma.file.count()).toEqual(0);
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
