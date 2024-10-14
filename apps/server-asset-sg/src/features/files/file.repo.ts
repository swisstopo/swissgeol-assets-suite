import { AssetFile, AssetFileType, LegalDocItemCode } from '@asset-sg/shared';
import { AssetId, User } from '@asset-sg/shared/v2';
import { Injectable } from '@nestjs/common';
import * as E from 'fp-ts/Either';
import { PrismaService } from '@/core/prisma.service';
import { CreateRepo, DeleteRepo } from '@/core/repo';
import { deleteFile } from '@/utils/file/delete-file';
import { putFile } from '@/utils/file/put-file';

@Injectable()
export class FileRepo implements CreateRepo<AssetFile, CreateFileData>, DeleteRepo<DeleteFileData> {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateFileData): Promise<AssetFile> {
    const name = await determineUniqueFilename(data.name, data.assetId, this.prisma);
    const isOcrCompatible = data.type !== 'Legal' && data.mediaType == 'application/pdf';
    const { id } = await this.prisma.file.create({
      select: { id: true },
      data: {
        name,
        size: data.size,
        ocrStatus: isOcrCompatible ? 'waiting' : 'willNotBeProcessed',
        type: data.type,
        legalDocItemCode: data.legalDocItemCode,
        lastModifiedAt: new Date(),
      },
    });
    await this.prisma.asset.update({
      select: { assetId: true },
      where: { assetId: data.assetId },
      data: {
        assetFiles: {
          create: {
            fileId: id,
          },
        },
        lastProcessedDate: new Date(),
        processor: data.user.email,
      },
    });
    const result = await putFile(data.name, data.content, data.mediaType)();
    if (E.isLeft(result)) {
      throw result.left;
    }
    return {
      id,
      name,
      size: data.size,
      type: data.type,
      legalDocItemCode: data.legalDocItemCode,
    };
  }

  delete({ id, assetId, user }: DeleteFileData): Promise<boolean> {
    return this.prisma.$transaction(async () => {
      const fileName = (
        await this.prisma.file.findUnique({
          where: { id },
          select: { name: true },
        })
      )?.name;
      if (fileName == null) {
        return false;
      }
      await this.prisma.assetFile.delete({
        where: {
          assetId_fileId: { assetId, fileId: id },
        },
        select: { fileId: true },
      });

      // Check if the file is assigned to any other assets.
      // In that case, we can't delete it.
      // This is necessary since files can be assigned to multiple assets at the database level.
      const isFileUnused =
        null !=
        this.prisma.assetFile.findFirst({
          where: { fileId: id, assetId: { not: assetId } },
          select: { fileId: true },
        });
      if (isFileUnused) {
        await this.prisma.file.delete({
          where: { id },
          select: { id: true },
        });
        const result = await deleteFile(fileName)();
        if (E.isLeft(result)) {
          throw result.left;
        }
      }

      // Update the processor fields on the file's asset.
      this.prisma.asset.update({
        where: { assetId },
        data: { lastProcessedDate: new Date(), processor: user.email },
        select: { assetId: true },
      });

      return true;
    });
  }
}

interface CreateFileData {
  name: string;
  size: number;
  type: AssetFileType;
  legalDocItemCode: LegalDocItemCode | null;
  mediaType: string;
  content: Buffer;
  assetId: AssetId;
  user: User;
}

interface DeleteFileData {
  id: number;
  assetId: AssetId;
  user: User;
}

export const determineUniqueFilename = async (
  fileName: string,
  assetId: AssetId,
  prisma: PrismaService
): Promise<string> => {
  const name = fileName.startsWith('a' + assetId + '_') ? fileName : 'a' + assetId + '_' + fileName;

  const lastDotIndex = name.lastIndexOf('.');
  const extension = lastDotIndex === -1 ? '' : name.substring(lastDotIndex + 1);
  const nameWithoutExtension = lastDotIndex === -1 ? name : name.substring(0, lastDotIndex);
  const match = /_(\d{14})$/.exec(nameWithoutExtension);
  const nameWithoutTs = match ? nameWithoutExtension.substring(0, match.index) : nameWithoutExtension;
  const nameToSearchFor = `${nameWithoutTs}.${extension}`;

  const isUniqueName =
    null ===
    (await prisma.file.findFirst({
      select: { id: true },
      where: {
        name: {
          contains: nameToSearchFor,
        },
      },
    }));
  if (isUniqueName) {
    return name;
  }
  const now = new Date();
  const pad = (value: number): string => value.toString().padStart(2, '0');
  return (
    `${nameWithoutTs}_${now.getFullYear()}` +
    `${pad(now.getMonth() + 1)}` +
    `${pad(now.getDate())}` +
    `${pad(now.getHours())}` +
    `${pad(now.getMinutes())}` +
    `${pad(now.getSeconds())}` +
    `.${extension}`
  );
};
