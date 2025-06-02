import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as O from 'fp-ts/Option';

import { AssetEditData } from './asset-edit.repo';
import { PrismaService } from '@/core/prisma.service';

@Injectable()
export class AssetEditService {
  constructor(private readonly prismaService: PrismaService) {}

  public async validateReferencesOrThrow(data: AssetEditData, id?: number): Promise<void> {
    // Validate siblings.
    for (const assetYId of data.patch.siblingAssetIds) {
      // Ensure that the sibling is not the asset itself.
      if (assetYId === id) {
        throw new HttpException('Cannot assign asset as its own sibling', HttpStatus.UNPROCESSABLE_ENTITY);
      }

      // Ensure that the sibling is in the same workgroup.
      const siblingCandidate = await this.prismaService.asset.findUnique({
        where: { assetId: assetYId },
        select: { workgroupId: true },
      });
      if (siblingCandidate?.workgroupId !== data.patch.workgroupId) {
        throw new HttpException(
          'Cannot assign sibling asset from different workgroup',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }

    // Validate parent asset.
    const assetMainId = O.toUndefined(data.patch.assetMainId);
    if (assetMainId) {
      // Ensure that the parent is not the asset itself.
      if (assetMainId === id) {
        throw new HttpException('Cannot assign asset as its own parent', HttpStatus.UNPROCESSABLE_ENTITY);
      }

      // Ensure that the parent is in the same workgroup.
      const assetMain = await this.prismaService.asset.findUnique({
        where: { assetId: assetMainId },
        select: { workgroupId: true },
      });
      if (assetMain?.workgroupId !== data.patch.workgroupId) {
        throw new HttpException('Cannot assign parent asset from different workgroup', HttpStatus.UNPROCESSABLE_ENTITY);
      }
    }
  }
}
