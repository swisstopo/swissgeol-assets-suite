import {
  Contact,
  ContactKindCode,
  LanguageCode,
  LegalDocCode,
  LocalizedItem,
  LocalizedItemCode,
  ReferenceData,
  ReferenceDataSchema,
  User,
} from '@asset-sg/shared/v2';
import { Controller, Get } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
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
      assetsFormats,
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

const localizedItemSelection = {
  name: true,
  nameDe: true,
  nameEn: true,
  nameFr: true,
  nameIt: true,
  description: true,
  descriptionDe: true,
  descriptionEn: true,
  descriptionFr: true,
  descriptionIt: true,
  geolCode: true,
} satisfies Prisma.NatRelItemSelect;

type SelectedItem = Prisma.NatRelItemGetPayload<{ select: typeof localizedItemSelection }>;

const mapItems = async <TRow extends SelectedItem, TCode extends LocalizedItemCode>(
  codeKey: keyof TRow,
  rows: Promise<TRow[]>,
  _enumType?: Record<string, TCode>,
): Promise<LocalizedItem<TCode>[]> =>
  (await rows).map((row) => ({
    code: row[codeKey] as TCode,
    name: {
      default: row.name,
      de: row.nameDe,
      fr: row.nameFr,
      it: row.nameIt,
      en: row.nameEn,
    },
    description: {
      default: row.description,
      de: row.descriptionDe,
      fr: row.descriptionFr,
      it: row.descriptionIt,
      en: row.descriptionEn,
    },
  }));

const contactSelection = {
  contactId: true,
  name: true,
  street: true,
  houseNumber: true,
  plz: true,
  locality: true,
  country: true,
  telephone: true,
  email: true,
  website: true,
  contactKindItemCode: true,
} satisfies Prisma.ContactSelect;

type SelectedContact = Prisma.ContactGetPayload<{ select: typeof contactSelection }>;

const mapContactFromPrisma = (row: SelectedContact): Contact => ({
  id: row.contactId,
  name: row.name,
  street: row.street,
  houseNumber: row.houseNumber,
  plz: row.plz,
  locality: row.locality,
  country: row.country,
  telephone: row.telephone,
  email: row.email,
  website: row.website,
  kindCode: row.contactKindItemCode as ContactKindCode,
});
