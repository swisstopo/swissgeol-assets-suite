import { Data, Model } from './base/model';
import { LocalizedItemCode } from './localized-item';

export interface Contact extends Model<ContactId> {
  name: string;
  street: string | null;
  houseNumber: string | null;
  plz: string | null;
  locality: string | null;
  country: string | null;
  telephone: string | null;
  email: string | null;
  website: string | null;
  contactKindItemCode: LocalizedItemCode;
}

export type ContactId = number;
export type ContactData = Data<Contact>;

export const AssetContactRoles = ['author', 'initiator', 'supplier'] as const;

export enum AssetContactRole {
  Author = 'author',
  Initiator = 'initiator',
  Supplier = 'supplier',
}

export interface AssetContact extends Pick<Contact, 'id'> {
  role: AssetContactRole;
}
