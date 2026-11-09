import { HttpException, HttpStatus } from '@nestjs/common';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { clearPrismaAssets, setupDB } from '../../../../../../test/setup-db';
import { PrismaService } from '@/core/prisma.service';
import { fakeCreateAssetData, fakeUserData } from '@/features/assets/asset.fake';
import { AssetRepo } from '@/features/assets/asset.repo';
import { FileRepo } from '@/features/assets/files/file.repo';
import { FileService } from '@/features/assets/files/file.service';
import { UserRepo } from '@/features/users/user.repo';

// Mock pdfjs-dist to avoid ES module import.meta issues in Jest.
jest.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({ getDocument: jest.fn() }));

describe(FileService, () => {
  const prisma = new PrismaService();
  const fileRepo = new FileRepo(prisma);
  const assetRepo = new AssetRepo(prisma, fileRepo);
  const userRepo = new UserRepo(prisma);
  const fileS3Service = { save: jest.fn(async () => undefined) };
  const searchWriterService = { register: jest.fn(async () => undefined) };
  const service = new FileService(
    fileRepo,
    fileS3Service as never,
    { emit: jest.fn() } as never,
    prisma,
    {} as never,
    assetRepo,
    searchWriterService as never,
  );

  beforeAll(async () => {
    await setupDB(prisma);
  });

  beforeEach(async () => {
    await clearPrismaAssets(prisma);
    jest.clearAllMocks();
  });

  const upload = async (data: { name: string; formatCode?: string }) => {
    const user = await userRepo.create(fakeUserData());
    const asset = await assetRepo.create({ ...fakeCreateAssetData(), creatorId: user.id });
    return service.create({
      ...data,
      size: 4,
      legalDocCode: null,
      assetId: asset.id,
      user,
      content: Buffer.from('test'),
      mediaType: 'text/plain',
    });
  };

  describe('create', () => {
    it('stores a supplied format unchanged, even if it differs from the extension', async () => {
      // When
      const record = await upload({ name: 'notes.txt', formatCode: 'textAnalog' });

      // Then
      expect(record.formatCode).toEqual('textAnalog');
      const row = await prisma.file.findUniqueOrThrow({ where: { id: record.id } });
      expect(row.assetFormatItemCode).toEqual('textAnalog');
      expect(fileS3Service.save).toHaveBeenCalledTimes(1);
    });

    it('derives an omitted format from the uploaded filename', async () => {
      // When
      const record = await upload({ name: 'Notes.TXT' });

      // Then
      expect(record.formatCode).toEqual('textDigital');
      const row = await prisma.file.findUniqueOrThrow({ where: { id: record.id } });
      expect(row.assetFormatItemCode).toEqual('textDigital');
    });

    it('rejects an unknown format with 422 before writing to the database or S3', async () => {
      // When
      const result = upload({ name: 'notes.txt', formatCode: 'noSuchFormat' });

      // Then
      await expect(result).rejects.toThrow(HttpException);
      await expect(result).rejects.toMatchObject({ status: HttpStatus.UNPROCESSABLE_ENTITY });
      expect(await prisma.file.count()).toEqual(0);
      expect(fileS3Service.save).not.toHaveBeenCalled();
      expect(searchWriterService.register).not.toHaveBeenCalled();
    });
  });
});
