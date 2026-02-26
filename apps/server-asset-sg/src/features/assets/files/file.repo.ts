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
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/core/prisma.service';
import { Repo, RepoListOptions } from '@/core/repo';
import { assetFileSelection, mapAssetFileFromPrisma } from '@/features/assets/files/prisma-file';
import { handlePrismaMutationError } from '@/utils/prisma';

@Injectable()
export class FileRepo implements Repo<AssetFile, FileIdentifier, CreateFileData, UpdateFileData> {
  constructor(private readonly prisma: PrismaService) {}

  async update({ id: fileId }: FileIdentifier, data: UpdateFileData): Promise<AssetFile | null> {
    try {
      const updatedFile = await this.prisma.file.update({
        where: { id: fileId },
        data,
      });

      return mapAssetFileFromPrisma(updatedFile);
    } catch (e) {
      return handlePrismaMutationError(e);
    }
  }

  async find({ id, assetId }: FileIdentifier): Promise<AssetFile | null> {
    const entry = await this.prisma.file.findFirst({
      where: { id, assetId },
      select: assetFileSelection,
    });
    if (entry == null) {
      return null;
    }
    return mapAssetFileFromPrisma(entry);
  }

  async list({ limit, offset, ids, assetId }: FileRepoListOptions = {}): Promise<AssetFile[]> {
    const where: Prisma.FileWhereInput = {};
    if (ids != null) {
      // Require the files to match one of the given identifiers.
      where['OR'] = ids.map(({ id, assetId }) => ({ id, assetId }));
    }
    if (assetId != null) {
      // Require the files to belong to a specific asset.
      where['assetId'] = assetId;
    }
    const entries = await this.prisma.file.findMany({
      where,
      take: limit,
      skip: offset,
      select: assetFileSelection,
    });
    return await Promise.all(entries.map((it) => mapAssetFileFromPrisma(it)));
  }

  async findOrphans(): Promise<AssetFile[]> {
    // With the one-to-many relationship (assetId is NOT NULL on file),
    // orphaned files should not exist. This method is kept for safety.
    return [];
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
        assetId: data.assetId,
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
    try {
      // Verify the file belongs to the specified asset before deleting.
      const existing = await this.prisma.file.findFirst({
        where: { id: file.id, assetId: file.assetId },
        select: { id: true },
      });
      if (existing == null) {
        return false;
      }
      await this.prisma.file.delete({
        where: { id: file.id },
        select: { id: true },
      });
      return true;
    } catch (e) {
      return handlePrismaMutationError(e) ?? false;
    }
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

export type UpdateFileData = Partial<Omit<CreateFileData, 'assetId' | 'user'>>;

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

interface FileRepoListOptions extends RepoListOptions<FileIdentifier> {
  assetId?: AssetId;
}
