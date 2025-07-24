import { Contact, ContactKindCode, LocalizedItem, LocalizedItemCode } from '@asset-sg/shared/v2';
import { Prisma } from '@prisma/client';

export const localizedItemSelection = {
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

export const mapItems = async <TRow extends SelectedItem, TCode extends LocalizedItemCode>(
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

export const contactSelection = {
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

export const mapContactFromPrisma = (row: SelectedContact): Contact => ({
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
