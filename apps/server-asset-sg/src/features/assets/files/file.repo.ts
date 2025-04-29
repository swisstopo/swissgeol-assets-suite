import { AssetFile, AssetFileType, LegalDocItemCode } from '@asset-sg/shared';
import { AssetId, User } from '@asset-sg/shared/v2';
import { Injectable } from '@nestjs/common';
import { OcrState } from '@prisma/client';
import * as E from 'fp-ts/Either';
import * as D from 'io-ts/Decoder';
import { PrismaService } from '@/core/prisma.service';
import { CreateRepo, DeleteRepo, FindRepo } from '@/core/repo';

@Injectable()
export class FileRepo
  implements FindRepo<AssetFile, FileIdentifier>, CreateRepo<AssetFile, CreateFileData>, DeleteRepo<FileIdentifier>
{
  constructor(private readonly prisma: PrismaService) {}

  async find({ id, assetId }: FileIdentifier): Promise<AssetFile | null> {
    const entry = await this.prisma.file.findFirst({
      where: { id, AssetFile: { some: { assetId } } },
      select: {
        id: true,
        name: true,
        nameAlias: true,
        size: true,
        type: true,
        legalDocItemCode: true,
        pageCount: true,
        lastModifiedAt: true,
      },
    });
    if (entry == null) {
      return null;
    }
    return {
      ...entry,
      size: Number(entry.size),
      legalDocItemCode: (D.nullable(LegalDocItemCode).decode(entry.legalDocItemCode) as E.Right<LegalDocItemCode>)
        .right,
    };
  }

  async create(data: CreateFileData): Promise<AssetFile> {
    const { fileName, fileNameAlias } = await determineUniqueFilename(data.name, data.assetId, this.prisma);
    const lastModifiedAt = new Date();
    const { id } = await this.prisma.file.create({
      select: { id: true },
      data: {
        fileName,
        fileNameAlias,
        size: data.size,
        ocrStatus: data.ocrStatus,
        type: data.type,
        legalDocItemCode: data.legalDocItemCode,
        lastModifiedAt,
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
    return {
      id,
      fileName,
      fileNameAlias,
      size: data.size,
      type: data.type,
      legalDocItemCode: data.legalDocItemCode,
      pageCount: null, // this is filled (if at all) by postprocessing via OCR
      lastModifiedAt,
    };
  }

  async delete(file: FileIdentifier): Promise<boolean> {
    return this.prisma.$transaction(async () => {
      const fileName = (
        await this.prisma.file.findUnique({
          where: { id: file.id },
          select: { fileName: true },
        })
      )?.fileName;
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
      await this.prisma.file.delete({
        where: { id: file.id },
        select: { id: true },
      });
      return true;
    });
  }
}

export interface FileIdentifier {
  id: number;
  assetId: AssetId;
}

export interface CreateFileData {
  name: string;
  size: number;
  type: AssetFileType;
  legalDocItemCode: LegalDocItemCode | null;
  ocrStatus: OcrState;
  assetId: AssetId;
  user: User;
}

export interface UniqueFileName {
  fileName: string;
  fileNameAlias: string;
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
        fileName: {
          contains: nameToSearchFor,
        },
      },
    }));
  if (isUniqueName) {
    return { fileName: name, fileNameAlias: fileName };
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
    fileNameAlias: fileName,
  };
};
