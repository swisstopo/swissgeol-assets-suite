import { IsOptional, IsString } from 'class-validator';

import { Data, Model } from '@/utils/data/model';

export interface Contact extends Model<ContactId> {
  name: string
  street: string | null
  houseNumber: string | null
  plz: string | null
  locality: string | null
  country: string | null
  telephone: string | null
  email: string | null
  website: string | null
  contactKindItemCode: string
}

export type ContactId = number
export type ContactData = Data<Contact>

export class ContactDataBoundary implements ContactData {
  @IsString()
  name!: string

  @IsString()
  @IsOptional()
  street!: string | null

  @IsString()
  @IsOptional()
  houseNumber!: string | null

  @IsString()
  @IsOptional()
  plz!: string | null

  @IsString()
  @IsOptional()
  locality!: string | null

  @IsString()
  @IsOptional()
  country!: string | null

  @IsString()
  @IsOptional()
  telephone!: string | null

  @IsString()
  @IsOptional()
  email!: string | null

  @IsString()
  @IsOptional()
  website!: string | null

  @IsString()
  contactKindItemCode!: string
}
