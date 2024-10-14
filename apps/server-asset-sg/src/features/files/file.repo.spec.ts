import { faker } from '@faker-js/faker';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { clearPrismaAssets, setupDB } from '../../../../../test/setup-db';
import { PrismaService } from '@/core/prisma.service';
import { determineUniqueFilename, FileRepo } from '@/features/files/file.repo';

describe(FileRepo, () => {
  const prisma = new PrismaService();

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
      expect(actual).toEqual(`a${assetId}_${original}`);
    });

    it('uses the name as-is if it is already prefixed with the assetId', async () => {
      // Given
      const assetId = faker.number.int({ min: 1 });
      const original = `a${assetId}_some-Other.filename.123`;

      // When
      const actual = await determineUniqueFilename(original, assetId, prisma);

      // Then
      expect(actual).toEqual(original);
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
          ocrStatus: 'willNotBeProcessed',
        },
      });
      const actual = await determineUniqueFilename(fullFileName, assetId, prisma);

      // Then
      expect(actual).toMatch(new RegExp(`^a${assetId}_${fileName}_\\d{4}\\d{2}\\d{2}\\d{2}\\d{2}\\d{2}\\.${fileExt}$`));
    });
  });
});
