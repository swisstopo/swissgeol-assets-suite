import { Data, Model } from './base/model';

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
  contactKindItemCode: string;
}

export type ContactId = number;
export type ContactData = Data<Contact>;

export const AssetContactRoles = ['author', 'initiator', 'supplier'] as const;
export type AssetContactRole = (typeof AssetContactRoles)[number];

export interface AssetContact extends Pick<Contact, 'id'> {
  role: AssetContactRole;
}

export type ContactWithRole = Contact & AssetContact;
