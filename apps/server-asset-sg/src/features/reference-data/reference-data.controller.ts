import {
  Contact,
  ContactKindCode,
  LanguageCode,
  LegalDocCode,
  ReferenceData,
  ReferenceDataSchema,
  User,
} from '@asset-sg/shared/v2';
import { Controller, Get } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { contactSelection, localizedItemSelection, mapContactFromPrisma, mapItems } from './prisma-reference-data';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { PrismaService } from '@/core/prisma.service';

@Controller('/reference-data')
export class ReferenceDataController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('/')
  @Authorize.User()
  async getReferenceData(@CurrentUser() user: User): Promise<ReferenceDataSchema> {
    const { prisma } = this;
    const [
      nationalInterestTypes,
      assetTopics,
      assetsFormats,
      assetKinds,
      contactKinds,
      languages,
      legalDocCodes,
      contacts,
    ] = await Promise.all([
      mapItems(
        'natRelItemCode',
        prisma.natRelItem.findMany({ select: { ...localizedItemSelection, natRelItemCode: true } }),
      ),
      mapItems(
        'manCatLabelItemCode',
        prisma.manCatLabelItem.findMany({ select: { ...localizedItemSelection, manCatLabelItemCode: true } }),
      ),
      mapItems(
        'assetFormatItemCode',
        prisma.assetFormatItem.findMany({ select: { ...localizedItemSelection, assetFormatItemCode: true } }),
      ),
      mapItems(
        'assetKindItemCode',
        prisma.assetKindItem.findMany({ select: { ...localizedItemSelection, assetKindItemCode: true } }),
      ),
      mapItems(
        'contactKindItemCode',
        prisma.contactKindItem.findMany({ select: { ...localizedItemSelection, contactKindItemCode: true } }),
        ContactKindCode,
      ),
      mapItems(
        'languageItemCode',
        prisma.languageItem.findMany({ select: { ...localizedItemSelection, languageItemCode: true } }),
        LanguageCode,
      ),
      mapItems(
        'legalDocItemCode',
        prisma.legalDocItem.findMany({ select: { ...localizedItemSelection, legalDocItemCode: true } }),
        LegalDocCode,
      ),
      this.loadContacts(user),
    ]);
    return plainToInstance(ReferenceDataSchema, {
      nationalInterestTypes,
      assetTopics,
      assetFormats: assetsFormats,
      assetKinds,
      contactKinds,
      languages,
      legalDocs: legalDocCodes,
      contacts,
    } satisfies ReferenceData);
  }

  private async loadContacts(user: User): Promise<Contact[]> {
    const entries = user.isAdmin
      ? this.prisma.contact.findMany({ select: contactSelection })
      : this.prisma.contact.findMany({
          where: {
            assetContacts: {
              some: { asset: { workgroupId: { in: [...user.roles.keys()] } } },
            },
          },
        });
    return (await entries).map(mapContactFromPrisma);
  }
}
