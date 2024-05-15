import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@/core/prisma.service';
import { Repo, RepoListOptions } from '@/core/repo';
import { Contact, ContactData, ContactId } from '@/features/contacts/contact.model';
import { satisfy } from '@/utils/define';
import { handlePrismaMutationError } from '@/utils/prisma';

@Injectable()
export class ContactRepo implements Repo<Contact, ContactId, ContactData> {
  constructor(
    private readonly prisma: PrismaService,
  ) {
  }

  async find(id: number): Promise<Contact | null> {
    const entry = await this.prisma.contact.findFirst({
      where: { contactId: id },
      select: contactSelection,
    });
    return entry == null
      ? null
      : parse(entry);
  }

  async list({ limit, offset, ids }: RepoListOptions<number>): Promise<Contact[]> {
    const entries = await this.prisma.contact.findMany({
      where: ids == null ? undefined : {
        contactId: { in: ids },
      },
      select: contactSelection,
      take: limit,
      skip: offset,
    });
    return await Promise.all(entries.map(parse));
  }

  async create(data: ContactData): Promise<Contact> {
    const entry = await this.prisma.contact.create({
      data: mapDataToPrisma(data),
      select: contactSelection,
    })
    return parse(entry);
  }

  async update(id: ContactId, data: ContactData): Promise<Contact | null> {
    try {
      const entry = await this.prisma.contact.update({
        where: { contactId: id },
        data: mapDataToPrisma(data),
        select: contactSelection,
      });
      return parse(entry);
    } catch (e) {
      return handlePrismaMutationError(e);
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.contact.delete({ where: { contactId: id } });
      return true;
    } catch (e) {
      return handlePrismaMutationError(e) ?? false;
    }
  }

}

const contactSelection = satisfy<Prisma.ContactSelect>()({
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
});

type SelectedContact = Prisma.ContactGetPayload<{ select: typeof contactSelection }>;

const parse = (data: SelectedContact): Contact => ({
  id: data.contactId,
  name: data.name,
  street: data.street,
  houseNumber: data.houseNumber,
  plz: data.plz,
  locality: data.locality,
  country: data.country,
  telephone: data.telephone,
  email: data.email,
  website: data.website,
  contactKindItemCode: data.contactKindItemCode ?? null,
});

const mapDataToPrisma = (data: ContactData): Prisma.ContactUncheckedCreateInput => ({
  name: data.name,
  street: data.street,
  houseNumber: data.houseNumber,
  plz: data.plz,
  locality: data.locality,
  country: data.country,
  telephone: data.telephone,
  email: data.email,
  website: data.website,
  contactKindItemCode: data.contactKindItemCode,
})
