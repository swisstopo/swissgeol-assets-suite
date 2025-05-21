import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as O from 'fp-ts/Option';

import { AssetEditData } from './asset-edit.repo';
import { PrismaService } from '@/core/prisma.service';

@Injectable()
export class AssetEditService {
  constructor(private readonly prismaService: PrismaService) {}

  public async validateReferencesOrThrow(data: AssetEditData, id?: number): Promise<void> {
    // check if any of the siblings are in another workgroup
    for (const assetYId of data.patch.siblingAssetIds) {
      const siblingCandidate = await this.prismaService.asset.findUnique({
        where: { assetId: assetYId },
        select: { workgroupId: true },
      });
      if (siblingCandidate?.workgroupId !== data.patch.workgroupId) {
        throw new HttpException(
          'Sibling assets must be in the same workgroup as the edited asset',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }

    // check if the parent asset is in another workgroup
    const assetMainId = O.toUndefined(data.patch.assetMainId);
    if (assetMainId) {
      const assetMain = await this.prismaService.asset.findUnique({
        where: { assetId: assetMainId },
        select: { workgroupId: true },
      });
      if (assetMain?.workgroupId !== data.patch.workgroupId) {
        throw new HttpException('Cannot assign parent asset from different workgroup', HttpStatus.UNPROCESSABLE_ENTITY);
      }
    }

    // check if any of the subordinate assets are in another workgroup for exisiting assets
    if (id) {
      const childAssets = await this.prismaService.asset.findMany({
        where: { assetMainId: id },
        select: { workgroupId: true },
      });

      for (const child of childAssets) {
        if (child.workgroupId !== data.patch.workgroupId) {
          throw new HttpException(
            'Child assets must be in the same workgroup as the parent asset',
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }
      }
    }
  }
}
