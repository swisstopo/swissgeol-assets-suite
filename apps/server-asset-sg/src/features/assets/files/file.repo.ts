import {
  AssetFile,
  AssetFileId,
  AssetId,
  FileProcessingStage,
  FileProcessingState,
  LegalDocCode,
  User,
} from '@asset-sg/shared/v2';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma.service';
import { CreateRepo, DeleteRepo, FindRepo } from '@/core/repo';
import { assetFileSelection, mapAssetFileFromPrisma } from '@/features/assets/files/prisma-file';
import { handlePrismaMutationError } from '@/utils/prisma';

@Injectable()
export class FileRepo
  implements FindRepo<AssetFile, FileIdentifier>, CreateRepo<AssetFile, CreateFileData>, DeleteRepo<FileIdentifier>
{
  constructor(private readonly prisma: PrismaService) {}

  async find({ id, assetId }: FileIdentifier): Promise<AssetFile | null> {
    const entry = await this.prisma.file.findFirst({
      where: { id, AssetFile: { some: { assetId } } },
      select: assetFileSelection,
    });
    if (entry == null) {
      return null;
    }
    return mapAssetFileFromPrisma(entry);
  }

  async findOrphans(): Promise<AssetFile[]> {
    const entries = await this.prisma.file.findMany({
      where: { AssetFile: { none: {} } },
    });
    return entries.map(mapAssetFileFromPrisma);
  }

  async create(data: CreateFileData): Promise<AssetFile> {
    const { fileName, nameAlias } = await determineUniqueFilename(data.name, data.assetId, this.prisma);
    const lastModifiedAt = new Date();
    const { id } = await this.prisma.file.create({
      select: { id: true },
      data: {
        name: fileName,
        nameAlias,
        size: data.size,
        fileProcessingState: data.fileProcessingState,
        fileProcessingStage: data.fileProcessingStage,
        type: data.legalDocCode === null ? 'Normal' : 'Legal',
        legalDocItemCode: data.legalDocCode,
        lastModifiedAt,
        AssetFile: {
          create: {
            assetId: data.assetId,
          },
        },
      },
    });
    return {
      id,
      name: fileName,
      alias: nameAlias,
      size: data.size,
      legalDocCode: data.legalDocCode,
      pageCount: null, // this is filled (if at all) by postprocessing via OCR
      lastModifiedAt,
      fileProcessingStage: data.fileProcessingStage,
      fileProcessingState: data.fileProcessingState,
      pageRangeClassifications: null, // this is filled (if at all) by postprocessing via Extraction
    };
  }

  async delete(file: FileIdentifier): Promise<boolean> {
    return this.prisma.$transaction(async () => {
      const fileName = (
        await this.prisma.file.findUnique({
          where: { id: file.id },
          select: { name: true },
        })
      )?.name;
      if (fileName == null) {
        return false;
      }
      await this.prisma.assetFile.delete({
        where: {
          assetId_fileId: { assetId: file.assetId, fileId: file.id },
        },
        select: { fileId: true },
      });

      // Check if the file is assigned to any other assets.
      // In that case, we can't delete it.
      // This is necessary since files can be assigned to multiple assets at the database level.
      const isFileUnused =
        null !=
        this.prisma.assetFile.findFirst({
          where: { fileId: file.id, assetId: { not: file.assetId } },
          select: { fileId: true },
        });
      if (!isFileUnused) {
        return false;
      }
      return await this.deleteUnused(file.id);
    });
  }

  async deleteUnused(id: AssetFileId): Promise<boolean> {
    try {
      await this.prisma.file.delete({
        where: { id },
        select: { id: true },
      });
      return true;
    } catch (e) {
      return handlePrismaMutationError(e) ?? false;
    }
  }
}

export interface FileIdentifier {
  id: number;
  assetId: AssetId;
}

export interface CreateFileData {
  name: string;
  size: number;
  legalDocCode: LegalDocCode | null;
  fileProcessingState: FileProcessingState;
  fileProcessingStage: FileProcessingStage | null;
  assetId: AssetId;
  user: User;
}

export interface UniqueFileName {
  fileName: string;
  nameAlias: string;
}

export const determineUniqueFilename = async (
  fileName: string,
  assetId: AssetId,
  prisma: PrismaService,
): Promise<UniqueFileName> => {
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
    return { fileName: name, nameAlias: fileName };
  }
  const now = new Date();
  const pad = (value: number): string => value.toString().padStart(2, '0');
  const uniqueName =
    `${nameWithoutTs}_${now.getFullYear()}` +
    `${pad(now.getMonth() + 1)}` +
    `${pad(now.getDate())}` +
    `${pad(now.getHours())}` +
    `${pad(now.getMinutes())}` +
    `${pad(now.getSeconds())}` +
    `.${extension}`;

  return {
    fileName: uniqueName,
    nameAlias: fileName,
  };
};
